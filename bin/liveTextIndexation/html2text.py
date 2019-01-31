#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys, codecs, re

try:
    import htmlentitydefs
except ImportError: #Python3
    import html.entities as htmlentitydefs

#inputs :
# html code in unicode string or will try to decode some known encodings
# extractor method
# encoding

def textify(html_text,extractor="raw", encoding="UTF8"):

    if not isinstance(html_text, unicode):
        try:
            html_text_unicode = unicode(html_text, encoding)
        except UnicodeDecodeError:
            try:
                html_text_unicode = unicode(html_text, 'utf-8')
            except UnicodeDecodeError:
                try:
                    html_text_unicode = unicode(html_text, 'iso-8859-1')
                except UnicodeDecodeError:
                    try:
                        html_text_unicode = unicode(html_text, 'cp1252')
                    except UnicodeDecodeError as e:
                        print "ERROR conv to unicode", e
    else:
        html_text_unicode = html_text
    if not html_text_unicode:
        return ""

    if extractor.lower() != "raw":
        try:
            from boilerpipe.extract import Extractor
            bp = Extractor(extractor=extractor, html=html_text_unicode)
            return bp.getText()
        except Exception:
            try:
                bp = Extractor(extractor=extractor, html=html_text_unicode)
                return bp.getText()
            except Exception as e:
                sys.stderr.write("ERROR running %s boilerpipe on %s:\n%s: %s\n" % (extractor, html_text, type(e), e))
                return ""
        del bp
    else:
        text = html_text_unicode

    ### Entity Nonsense from A. Swartz's html2text http://www.aaronsw.com/2002/html2text/html2text.py ###

    def name2cp(k):
        if k == 'apos': return ord("'")
        if hasattr(htmlentitydefs, "name2codepoint"): # requires Python 2.3
            return htmlentitydefs.name2codepoint[k]
        else:
            k = htmlentitydefs.entitydefs[k]
            if k.startswith("&#") and k.endswith(";"): return int(k[2:-1]) # not in latin-1
            return ord(codecs.latin_1_decode(k)[0])

    def charref(name):
        if name[0] in ['x','X']:
            c = int(name[1:], 16)
        else:
            c = int(name)
        try:
            return unichr(c)
        except NameError: #Python3
            return chr(c)

    def entityref(c):
        try: name2cp(c)
        except KeyError: return "&" + c + ';'
        else:
            try:
                return unichr(name2cp(c))
            except NameError: #Python3
                return chr(name2cp(c))

    def replaceEntities(s):
        s = s.group(1)
        if s[0] == "#":
            return charref(s[1:])
        else: return entityref(s)

    r_unescape = re.compile(r"&(#?[xX]?(?:[0-9a-fA-F]+|\w{1,8}));")
    def unescape(s):
        s = s.replace('&nbsp;', ' ')
        return r_unescape.sub(replaceEntities, s)

    ### End Entity Nonsense ###

    re_clean_comments = re.compile(r'<!--.*?-->', re.I|re.DOTALL)
    re_clean_javascript = re.compile(r'<script[^>]*/?>.*?</script>', re.I|re.DOTALL)
    re_clean_style = re.compile(r'<style[^>]*/?>.*?</style>', re.I|re.DOTALL)
    re_clean_balises = re.compile(r'<[/!?]?\[?[a-z0-9\-]+[^>]*>', re.I|re.DOTALL)
    #re_clean_blanks = re.compile(r'[ \s]+')
    re_clean_blanks = re.compile(r'[ \t\f\v]+')
    re_clean_multiCR = re.compile(r'( ?[\n\r]+)+',re.M)
    try:
        text = unescape(text)
        text = re_clean_blanks.sub(' ', text)
        text = re_clean_comments.sub(' ', text)
        text = re_clean_javascript.sub(' ', text)
        text = re_clean_style.sub(' ', text)
        text = re_clean_balises.sub(' ', text)
        text = re_clean_blanks.sub(' ', text).strip()
        text = re_clean_multiCR.sub('\n\r',text)
    except:
        pass

    return text

