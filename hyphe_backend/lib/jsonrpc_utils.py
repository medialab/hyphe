#!/usr/bin/env python
# -*- coding: utf-8 -*-

def format_error(error):
    print error
    try:
        msg = error.msg
    except:
        try:
            msg = error.getErrorMessage()
        except:
            msg = error
    return {'code': 'fail', 'message': str(error)}

def format_success(res):
    return {'code': 'success', 'result': res}

def is_error(res):
    if isinstance(res, dict) and "code" in res and res['code'] == 'fail':
        return True
    return False

