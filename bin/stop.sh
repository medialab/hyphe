#!/bin/bash

echo "Stopping Hyphe's Core JsonRPC API..."
if test -f twistd.pid; then
  TWISTD_PID=$(cat twistd.pid)
  if ps -p $TWISTD_PID > /dev/null; then
    kill $TWISTD_PID
    sleep 0.5
    if ps -p $TWISTD_PID > /dev/null; then
      kill -9 $TWISTD_PID
      sleep 1
      if ps -p $TWISTD_PID > /dev/null; then
        echo "...could not stop, please kill -15 $TWISTD_PID"
        exit 1
      fi
    fi
    echo "...stopped."
  else
    echo "...does not seem like running, removing PID lock file"
  fi
  rm -f twistd.pid
  sleep 1
else
  echo "...does not seem like running."
fi

echo "Stopping Hyphe's Java Memory Structure..."
if test -f java-memstruct.pid; then
  JAVA_PID=$(cat java-memstruct.pid)
  if ps -p $JAVA_PID > /dev/null; then
    kill $JAVA_PID
    sleep 0.5
    if ps -p $JAVA_PID > /dev/null; then
      kill -9 $JAVA_PID
      sleep 1
      if ps -p $JAVA_PID > /dev/null; then
        echo "...could not stop, please kill -15 $JAVA_PID"
        exit 1
      fi
    fi
    echo "...stopped."
  else
    echo "...does not seem like running, removing PID lock file"
  fi
  rm -f java-memstruct.pid
else
  echo "...does not seem like running."
fi

echo "Hyphe's backend is now stopped."
