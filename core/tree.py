import pprint

class Stem(object):
	def __init__(self, name="", page=False):
		self.name = name
		self.page = page
	def __hash__(self):
		return self.name.__hash__()
	def __str__(self):
		return self.name + ("*" if self.page else "")
	def __unicode__(self):
		return self.name
	def __eq__(self, other):
		return str(self) == str(other)

def myprint(dico, indent=0):
	for k,v in dico.iteritems():
		print "\t"*indent, k
		myprint(v, indent+1)


def add_page(tree, page):
	lru = page
	#content = page.content
	stems = lru.split("|")
	current = tree
	len_lru = len(stems)
	for i, stem in enumerate(stems) :
		if i == len_lru-1 :
			if current.get(stem) :
				temp = current[stem]
				del current[stem]
				current[Stem(stem, page=True)] = temp
			else :
				current[Stem(stem, page=True)] = {}
		else :
			if not current.get(stem):
				stem = Stem(stem, False)
				current[stem] = {}
			current = current[stem]

def flatten(dico, prefix="http"):
	for k, v in dico.iteritems():
		if k.page:
			yield prefix + "|" + str(k)
		if v :
			for n in flatten(v, prefix + "|" + str(k)):
				yield n

def children(tree, lru_prefix):
	current = tree
	for stem in lru_prefix.split("|"):
		current = current[stem]
		prefix = stem
	for n in flatten(current, prefix):
		yield n

tree = {}

lrus = [
	"fr|google|bob|thomas",
	"fr|google|bob|jean|mpa",
	"fr|google|bob|jean|mdazda",
	"com|twitter",
	"com|facebook",
]


for lru in lrus	:
	add_page(tree, lru)

g = flatten(tree)
for e in g : 
	print e

for e in children(tree,"fr|google") :
	print e
