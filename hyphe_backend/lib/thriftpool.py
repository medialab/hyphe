#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Library to handle connection pools to Thrift
adapted from :
- https://github.com/amuraru/thrift-connection-pool/ by Adrian Muraru (Apache licence)
- https://github.com/146/thrift_client by Albert Sheu
"""

import inspect, socket, Queue, copy
from threading import BoundedSemaphore
from twisted.internet import reactor, defer
from twisted.internet.defer import inlineCallbacks
from twisted.internet.threads import deferToThreadPool
from twisted.python.threadpool import ThreadPool, WorkerStop
from thrift.transport import TTransport
from thrift.transport.TSocket import TSocket
from thrift.Thrift import TException
from hyphe_backend.lib.utils import format_error

DEFAULT_POOL_SIZE = 8
DEFAULT_THREADKILL_TIMEOUT = 3
DEFAULT_NETWORK_TIMEOUT = 1800000

def _canonicalize_hostport(host, port):
    if port is not None:
        host = socket.gethostbyname(host)
        return host, port
    elif port is None and ':' in host:
        host, port = host.split(':')
        host = socket.gethostbyname(host)
        port = int(port)
        return host, port
    else:
        raise ValueError('Invalid host, port pair: %r', (host, port))

# redefine ThreadPool's stop function to add a timeout on thread.join
class SafeThreadPool(ThreadPool):
    def stop(self):
        self.joined = True
        self.started = False
        threads = copy.copy(self.threads)
        while self.workers:
            self.q.put(WorkerStop)
            self.workers -= 1
        for thread in threads:
            thread.join(DEFAULT_THREADKILL_TIMEOUT)

class ThriftConnectionPool(object):

    def __init__(self, iface_cls,
                 host, port,
                 pool_size=DEFAULT_POOL_SIZE,
                 network_timeout=DEFAULT_NETWORK_TIMEOUT,
                 framed_transport=True,
                 compact_protocol=False):
        self.host, self.port = _canonicalize_hostport(host, port)
        self.iface_cls = iface_cls
        self.framed_transport = framed_transport
        self.compact_protocol = compact_protocol
        self.pool_size = pool_size
        self.network_timeout = network_timeout
        self._closed = False
        self._semaphore = BoundedSemaphore(pool_size)
        # Choice of LiFo queue encouraged here https://review.cloudera.org/r/1800/diff/?expand=1
        self._connection_queue = Queue.LifoQueue(pool_size)

    def close(self):
        self._closed = True
        while not self._connection_queue.empty():
            try:
                conn = self._connection_queue.get(block=False)
                try:
                    self._close_thrift_connection(conn)
                except:
                    pass
            except Queue.Empty:
                pass

    def _create_thrift_connection(self):
        tsocket = TSocket(self.host, self.port)
        if self.network_timeout > 0:
            tsocket.setTimeout(self.network_timeout)
        if self.framed_transport:
            transport = TTransport.TFramedTransport(tsocket)
        else:
            transport = TTransport.TBufferedTransport(tsocket)
        if self.compact_protocol:
            from thrift.protocol.TCompactProtocol import TCompactProtocol as TProtocol
        else:
            from thrift.protocol.TBinaryProtocol import TBinaryProtocolAccelerated as TProtocol
        protocol = TProtocol(transport)
        connection = self.iface_cls(protocol)
        transport.open()
        return connection

    def _close_thrift_connection(self, conn):
        try:
            conn._iprot.trans.close()
        except:
            print 'warn: failed to close iprot trans on',conn
            pass
        try:
            conn._oprot.trans.close()
        except:
            print 'warn: failed to close oprot trans on',conn
            pass

    def get_connection(self):
        """ get a connection from the pool. This blocks until one is available.
        """
        self._semaphore.acquire()
        if self._closed:
            raise RuntimeError('connection pool closed')
        try:
            return self._connection_queue.get(block=False)
        except Queue.Empty:
            try:
                return self._create_thrift_connection()
            except:
                self._semaphore.release()
                raise

    def return_connection(self, conn):
        """ return a thrift connection to the pool.
        """
        if self._closed:
            self._close_thrift_connection(conn)
            return
        self._connection_queue.put(conn)
        self._semaphore.release()

    def release_conn(self, conn):
        """ call when the connect is no usable anymore
        """
        self._close_thrift_connection(conn)
        if not self._closed:
            try:
                self._semaphore.release()
            except:
                pass

class ThriftPooledClient(object):

    def __init__(self, iface_cls,
                 host, port,
                 pool_size=DEFAULT_POOL_SIZE,
                 async = False,
                 retries = 3,
                 network_timeout = DEFAULT_NETWORK_TIMEOUT,
                 framed_transport = True,
                 compact_protocol = False):
        self.port = port
        self.retries = retries
        self._connection_pool = ThriftConnectionPool(iface_cls=iface_cls, host=host, port=port, framed_transport=framed_transport, compact_protocol=compact_protocol, pool_size=pool_size, network_timeout=network_timeout)
        # inject all methods defined in the thrift Iface class
        for m in inspect.getmembers(iface_cls, predicate=inspect.ismethod):
            setattr(self, m[0], self.__create_thrift_proxy__(m[0]))
        # dispatch pool of multiple connections in Twisted threads
        if pool_size > 1 or async:
            self.threadpool = SafeThreadPool(1, pool_size)
            reactor.callFromThread(self.threadpool.start)
            # Allow Ctrl-C to get you out cleanly:
            reactor.addSystemEventTrigger('after', 'shutdown', self.threadpool.stop)

    def close(self):
        if hasattr(self, 'threadpool'):
            self.threadpool.stop()
        self._connection_pool.close()

    def __create_thrift_proxy__(self, methodName):
        def __thrift_proxy(*args):
            if hasattr(self, 'threadpool'):
                return deferToThreadPool(reactor, self.threadpool, self.__thrift_call__, methodName, *args)
            return self.__thrift_call__(methodName, *args)
        return __thrift_proxy

    def __thrift_call__(self, method, *args):
        attempts_left = self.retries
        result = None
        while True:
            try:
                conn = self._connection_pool.get_connection()
            except Exception as e:
                return self._format_connexion_error(e)
            try:
                result = getattr(conn, method)(*args)
            except TTransport.TTransportException as e:
                #broken connection, release it
                self._connection_pool.release_conn(conn)
                if attempts_left > 0:
                    attempts_left -= 1
                    continue
                return self._format_connexion_error(e)
            except Exception as e:
                #data exceptions, return connection and don't retry
                self._connection_pool.return_connection(conn)
                return format_error(e)

            #call completed succesfully, return connection to pool
            self._connection_pool.return_connection(conn)
            return result

    def _format_connexion_error(self, e):
        error = format_error(e)
        error['message'] = error['message'].replace('127.0.0.1:%d' % self.port, 'MemoryStructure')
        return error

