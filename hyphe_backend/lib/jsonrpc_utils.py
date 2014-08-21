#!/usr/bin/env python
# -*- coding: utf-8 -*-

def format_error(error):
    try:
        msg = error.msg
    except:
        try:
            msg = error.getErrorMessage()
        except:
            msg = error
    return {'code': 'fail', 'message': str(msg)}

def format_success(res):
    return {'code': 'success', 'result': res}

def is_error(res):
    if (isinstance(res, dict) and "code" in res and res['code'] == 'fail') or isinstance(res, Exception):
        return True
    return False

def test_bool_arg(boolean):
    return (isinstance(boolean, bool) and boolean) or (isinstance(boolean, unicode) and str(boolean).lower() == 'true') or (isinstance(boolean, int) and boolean != 0)

