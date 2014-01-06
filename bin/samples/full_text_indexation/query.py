# -*- coding: utf-8 -*-
# solr
import sunburnt
import codecs
from pprint import pprint
from hyphe_backend.lib import config_hci

config = config_hci.load_config()
if not config:
    print "error while loading config"
    exit()

# solr
solr = sunburnt.SolrInterface("http://%s:%s/%s" % (config["solr"]['host'], config["solr"]['port'], config["solr"]['path'].lstrip('/')))
print solr.schema.fields.keys()

results = solr.query(text=u"*digital*").facet_by("web_entity").execute()
print results.facet_counts.facet_fields
results = solr.query(html=u"*digital*").facet_by("web_entity").execute()
print results.facet_counts.facet_fields


def verify_html_strip():
	results_text = solr.query(text=u"*médialab*",web_entity="Www Medialab Sciences-Po Fr").paginate(start=0,rows=50).execute()
	results_html = solr.query(html=u"*médialab*",web_entity="Www Medialab Sciences-Po Fr").paginate(start=0,rows=50).execute()

	print "%s result in text, %s in html"%(len(results_text),len(results_html))

	text_ids = [r["id"] for r in results_text]
	html_ids = [r["id"] for r in results_html]
	print text_ids
	print html_ids
	ids=set(html_ids) - set(text_ids)
	id = list(ids)[0]

	weird_page = [r for r in results_html if r["id"]==id][0]
	with codecs.open("weird_page.html","w","UTF8") as html_file, codecs.open("weird_page.txt","w","UTF8") as text_file,codecs.open("weird_page.json","w","UTF8") as metadata:
		html_file.write(weird_page["html"][0])
		text_file.write(weird_page["text"][0])
		pprint(weird_page,metadata)

# for result in results:
# 	print result
