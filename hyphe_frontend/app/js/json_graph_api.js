// Mathieu Jacomy @ Sciences Po Médialab & WebAtlas
// version 0.3
var json_graph_api = {
	parseGEXF: function(gexf){
		var viz_error="http:///www.gexf.net/1.1draft/viz";	// Vis namespace (there was an error sooner)
		var viz="http://www.gexf.net/1.2draft/viz";	// Vis namespace
		
		// Parse Attributes
		// This is confusing, so I'll comment heavily
		var nodesAttributes = [];	// The list of attributes of the nodes of the graph that we build in json
		var edgesAttributes = [];	// The list of attributes of the edges of the graph that we build in json
		var attributesNodes = gexf.getElementsByTagName("attributes");	// In the gexf (that is an xml), the list of xml nodes "attributes" (note the plural "s")
		
		for(i = 0; i<attributesNodes.length; i++){
			var attributesNode = attributesNodes[i];	// attributesNode is each xml node "attributes" (plural)
			if(attributesNode.getAttribute("class") == "node"){
				var attributeNodes = attributesNode.getElementsByTagName("attribute");	// The list of xml nodes "attribute" (no "s")
				for(ii = 0; ii<attributeNodes.length; ii++){
					var attributeNode = attributeNodes[ii];	// Each xml node "attribute"
					
					var id = attributeNode.getAttribute("id"),
						title = attributeNode.getAttribute("title"),
						type = attributeNode.getAttribute("type");
					
					var attribute = {id:id, title:title, type:type};
					nodesAttributes.push(attribute);
					
				}
			} else if(attributesNode.getAttribute("class") == "edge"){
				var attributeNodes = attributesNode.getElementsByTagName("attribute");	// The list of xml nodes "attribute" (no "s")
				for(ii = 0; ii<attributeNodes.length; ii++){
					var attributeNode = attributeNodes[ii];	// Each xml node "attribute"
					
					var id = attributeNode.getAttribute("id"),
						title = attributeNode.getAttribute("title"),
						type = attributeNode.getAttribute("type");
						
					var attribute = {id:id, title:title, type:type};
					edgesAttributes.push(attribute);
					
				}
			}
		}
		
		var nodes = [];	// The nodes of the graph
		var nodesNodes = gexf.getElementsByTagName("nodes")	// The list of xml nodes "nodes" (plural)
		
		for(i=0; i<nodesNodes.length; i++){
			var nodesNode = nodesNodes[i];	// Each xml node "nodes" (plural)
			var nodeNodes = nodesNode.getElementsByTagName("node");	// The list of xml nodes "node" (no "s")
			for(ii=0; ii<nodeNodes.length; ii++){
				var nodeNode = nodeNodes[ii];	// Each xml node "node" (no "s")
				
				var id = nodeNode.getAttribute("id");
				var label = nodeNode.getAttribute("label") || id;
				
				//viz
				var size = 1;
				var x = 50 - 100*Math.random();
				var y = 50 - 100*Math.random();
				var color = {r:180, g:180, b:180};
				
				var sizeNodes = nodeNode.getElementsByTagNameNS(viz, "size");
				if(sizeNodes.length==0)	// Taking in account a previous error of Gephi
					sizeNodes = nodeNode.getElementsByTagNameNS(viz_error, "size");
				if(sizeNodes.length>0){
					sizeNode = sizeNodes[0];
					size = parseFloat(sizeNode.getAttribute("value"));
				}
				var positionNodes = nodeNode.getElementsByTagNameNS(viz, "position");
				if(positionNodes.length==0)	// Taking in account a previous error of Gephi
					positionNodes = nodeNode.getElementsByTagNameNS(viz_error, "position");
				if(positionNodes.length>0){
					var positionNode = positionNodes[0];
					x = parseFloat(positionNode.getAttribute("x"));
					y = -parseFloat(positionNode.getAttribute("y"));
				}
				var colorNodes = nodeNode.getElementsByTagNameNS(viz, "color");
				if(colorNodes.length==0)	// Taking in account a previous error of Gephi
					colorNodes = nodeNode.getElementsByTagNameNS(viz_error, "color");
				if(colorNodes.length>0){
					colorNode = colorNodes[0];
					color.r = parseInt(colorNode.getAttribute("r"));
					color.g = parseInt(colorNode.getAttribute("g"));
					color.b = parseInt(colorNode.getAttribute("b"));
				}
				
				// Create Node
				var node = {id:id, label:label, size:size, x:x, y:y, color:color, attributes:[]};	// The graph node
				
				// Attribute values
				var attvalueNodes = nodeNode.getElementsByTagName("attvalue");
				for(iii=0; iii<attvalueNodes.length; iii++){
					var attvalueNode = attvalueNodes[iii];
					var attr = attvalueNode.getAttribute("for");
					var val = attvalueNode.getAttribute("value");
					node.attributes.push({attr:attr, val:val});
				}
				nodes.push(node);
			}
		}

		var edges = [];
		var edgesNodes = gexf.getElementsByTagName("edges");
		for(i=0; i<edgesNodes.length; i++){
			var edgesNode = edgesNodes[i];
			var edgeNodes = edgesNode.getElementsByTagName("edge");
			for(ii=0; ii<edgeNodes.length; ii++){
				var edgeNode = edgeNodes[ii];
				var source = edgeNode.getAttribute("source");
				var target = edgeNode.getAttribute("target");
				var edge = {id:ii, sourceID:source, targetID:target, attributes:[]};
				var attvalueNodes = edgeNode.getElementsByTagName("attvalue");
				for(iii=0; iii<attvalueNodes.length; iii++){
					var attvalueNode = attvalueNodes[iii];
					var attr = attvalueNode.getAttribute("for");
					var al = attvalueNode.getAttribute("value");
					edge.attributes.push({attr:attr, val:val});
				}
				edges.push(edge);
			}
		}
		
		return {nodesAttributes:nodesAttributes, edgesAttributes:edgesAttributes, nodes:nodes, edges:edges};
	},
	
	buildGEXF: function(graph){
		// Blob Builder
		var content = []
		
		var today = new Date();
		
		content.push('<?xml version="1.0" encoding="UTF-8"?><gexf xmlns="http://www.gexf.net/1.2draft" version="1.2" xmlns:viz="http://www.gexf.net/1.2draft/viz" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.gexf.net/1.2draft http://www.gexf.net/1.2draft/gexf.xsd">');
		content.push("\n" +  '<meta lastmodifieddate="'+today+'"><author>'+json_graph_api.xmlEntities((graph.attributes && graph.attributes.author) || '')+'</author><description>'+json_graph_api.xmlEntities((graph.attributes && graph.attributes.description) || '')+'</description></meta>');
		content.push("\n" +  '<graph defaultedgetype="directed" mode="static">');
		
		// Nodes Attributes
		content.push("\n" +  '<attributes class="node" mode="static">');
		graph.nodesAttributes.forEach(function(nodeAttribute){
			content.push("\n" +  '<attribute id="'+json_graph_api.xmlEntities(nodeAttribute.id)+'" title="'+json_graph_api.xmlEntities(nodeAttribute.title)+'" type="'+json_graph_api.xmlEntities(nodeAttribute.type)+'"></attribute>');
		});
		content.push("\n" +  '</attributes>');
		
		// Edges Attributes
		content.push("\n" +  '<attributes class="edge" mode="static">');
		graph.edgesAttributes.forEach(function(edgeAttribute){
			content.push("\n" +  '<attribute id="'+json_graph_api.xmlEntities(edgeAttribute.id)+'" title="'+json_graph_api.xmlEntities(edgeAttribute.title)+'" type="'+json_graph_api.xmlEntities(edgeAttribute.type)+'"></attribute>');
		});
		content.push("\n" +  '</attributes>');
		
		// Nodes
		content.push("\n" +  '<nodes>');
		graph.nodes.forEach(function(node){
			var id = json_graph_api.xmlEntities(node.id);
			var label = node.label || '';
			
			content.push("\n" +  '<node id="'+id+'" label="'+json_graph_api.xmlEntities(label)+'">');
			
			// AttributeValues
			content.push("\n" +  '<attvalues>');
			node.attributes.forEach(function(nodeAttribute){
				content.push("\n" +  '<attvalue for="'+json_graph_api.xmlEntities(nodeAttribute.attr)+'" value="'+json_graph_api.xmlEntities(nodeAttribute.val)+'"></attvalue>');
			});
			
			content.push("\n" +  '</attvalues>');
			
			if(node.size)
				content.push("\n" +  '<viz:size value="'+node.size+'"></viz:size>');
			if(node.x && node.y)
				content.push("\n" +  '<viz:position x="'+node.x+'" y="'+(-node.y)+'"></viz:position>');
			// if(node.color)
			// 	content.push("\n" +  '<viz:color r="'+Math.round(node.color.r)+'" g="'+Math.round(node.color.g)+'" b="'+Math.round(node.color.b)+'"></viz:color>');
			
			content.push("\n" +  '</node>');
			
		});
		content.push("\n" +  '</nodes>');
		
		// Edges
		content.push("\n" +  '<edges>');
		graph.edges.forEach(function(edge){
			var sourceId = json_graph_api.xmlEntities(edge.sourceID);
			var targetId = json_graph_api.xmlEntities(edge.targetID);
			
			content.push("\n" +  '<edge source="'+sourceId+'" target="'+targetId+'" >');
			
			// AttributeValues
			content.push("\n" +  '<attvalues>');
			edge.attributes.forEach(function(edgeAttribute){
				content.push("\n" +  '<attvalue for="'+json_graph_api.xmlEntities(edgeAttribute.attr)+'" value="'+json_graph_api.xmlEntities(edgeAttribute.val)+'"></attvalue>');
			});
			
			content.push("\n" +  '</attvalues>');
			content.push("\n" +  '</edge>');
			
		});
		content.push("\n" +  '</edges>');
		
		content.push("\n" +  '</graph></gexf>');
		
		// Finalization
		return content
	},
	
	buildIndexes: function(graph){
		// Index the attributes-values by attribute Id in each node
		graph.nodes.forEach(function(node){
			node.attributes_byId = {};
			node.attributes.forEach(function(attvalue){
				node.attributes_byId[attvalue.attr] = attvalue.val;
			});
		});
		
		// Index the attributes-values by attribute Id in each edge
		graph.edges.forEach(function(edge){
			edge.attributes_byId = {};
			edge.attributes.forEach(function(attvalue){
				edge.attributes_byId[attvalue.attr] = attvalue.val;
			});
		});
		
		// Index the nodes by Id
		graph.nodes_byId = {};
		graph.nodes.forEach(function(node){
			graph.nodes_byId[node.id] = node;
		});
		
		// Index the attributes by Id
		graph.nodesattributes_byId = {};
		graph.nodesAttributes.forEach(function(att){
			graph.nodesattributes_byId[att.id] = att;
		});
		graph.edgesattributes_byId = {};
		graph.edgesAttributes.forEach(function(att){
			graph.edgesattributes_byId[att.id] = att;
		});
		
		// Init the edges for each node
		graph.nodes.forEach(function(node){
			node.inEdges = [];
			node.outEdges = [];
		});
		
		// Index the edges for each node
		graph.edges.forEach(function(edge){
			graph.nodes_byId[edge.sourceID].outEdges.push(edge);
			graph.nodes_byId[edge.targetID].inEdges.push(edge);
		});
		
		// Index the source and target node for each edge
		graph.edges.forEach(function(edge){
			edge.source = graph.nodes_byId[edge.sourceID];
			edge.target = graph.nodes_byId[edge.targetID];
		});
	},
	
	xmlEntities: function(expression) {
		expression = expression || "";
		return String(expression).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	},
	
	removeHidden: function(graph){
		var hiddenNodes = graph.nodes.filter(function(node){return node.hidden !== undefined && node.hidden})
			,hiddenIds = hiddenNodes.map(function(node){return node.id})
		
		// nodes
		graph.nodes = graph.nodes.filter(function(node){return node.hidden === undefined || !node.hidden})
		
		// nodes by id
		var new_nodes_byId = {}
		for(id in graph.nodes_byId){
			if(!hiddenIds.some(function(hid){return hid == id})){
				new_nodes_byId[id] = graph.nodes_byId[id]
			}
		}
		graph.nodes_byId = new_nodes_byId

		// edges
		graph.edges = graph.edges.filter(function(edge){
			return !hiddenIds.some(function(hid){return hid == edge.sourceID || hid == edge.targetID}) 
		})

		// Reindexing
		json_graph_api.buildIndexes(graph)
	},

	getBackbone: function(graph, removeHidden){
		if(removeHidden === undefined)
			removeHidden = false;
		return {
			attributes:{
				title:(graph.attributes && graph.attributes.title) || 'My Network',
				author:(graph.attributes && graph.attributes.author) || 'Unknown Author',
				description:(graph.attributes && graph.attributes.description) || ''
			},
			nodesAttributes:graph.nodesAttributes.map(function(na){
				return {
					id: na.id,
					title: na.title,
					type: na.type
				}
			}),
			edgesAttributes:graph.edgesAttributes.map(function(ea){
				return {
					id: ea.id,
					title: ea.title,
					type: ea.type
				}
			}),
			nodes:graph.nodes.filter(function(n){
				return !removeHidden || !n.hidden;
			}).map(function(n){
				var node = {
					id: n.id,
					label: n.label,
					attributes: n.attributes.map(function(a){
						return {
							attr: a.attr,
							val: a.val
						};
					}),
				};
				if(n.x && n.y){
					node.x = n.x;
					node.y = n.y;
				}
				if(n.size)
					node.size = n.size;
				if(n.color)
					node.color = n.color;
				return node;
			}),
			edges:graph.edges.filter(function(e){
				return !removeHidden || (!e.source.hidden && !e.target.hidden);
			}).map(function(e){
				return {
					id: e.id,
					sourceID: e.sourceID,
					targetID: e.targetID,
					attributes: e.attributes.map(function(a){
						return {
							attr: a.attr,
							val: a.val
						};
					}),
				};
			})
		};
	},
	
	storeGraph: function(graph, type){
		type = type || 'json';
		try{
			/*if(type == 'compact'){
				sessionStorage['network_type'] = 'compact';
				
				var txtgraph = JSON.stringify(json_graph_api.getBackbone(graph));
				var compacttxtgraph = json_graph_api.compactor.compress(txtgraph);
				sessionStorage['network'] = compacttxtgraph;
			} else */if(type == 'json'){
				sessionStorage['network_type'] = 'json';
				sessionStorage['network'] = JSON.stringify(json_graph_api.getBackbone(graph));
			}
		} catch(e) {
			alert("The size of the network seems to exceed the capacity of your session storage.\nThe network could not be sent.\n"+e);
			return false;
		}
		return true;
	},
	
	retrieveGraph: function(){
		var network_type = sessionStorage.getItem('network_type');
		
		if(network_type == 'json'){
			var txtgraph = sessionStorage.getItem('network');
			return eval( "("+txtgraph+")");
			
		}/* else if(network_type == 'compact') {
			var compacttxtgraph = sessionStorage.getItem('network');
			txtgraph = json_graph_api.compactor.decompress(compacttxtgraph);
			
			return eval( "("+txtgraph+")");
			
		}
		console.log("json_graph_api.retrieveGraph error : Unknown network type");
		*/
	}
	
	/*
	// Bon ben finalement ce truc ne convient pas.
	compactor: {
		compress: function(uncompressed){
			var compressed_asArray = json_graph_api.compactor.lzwcompress(uncompressed);
			
			// LZW compresses our data as an Array of integers.
			// We want to encode it as a String.
			// We could use CharCode but if the integers become too big, it causes encoding issues !
			// Se we will limit to 256 CharCodes and encode the number in several characters.
			// We will compute here how many characters are necessary.
			
			var maxInt = 0;
			for(i in compressed_asArray){
				maxInt = Math.max(maxInt, compressed_asArray[i]);
			}
			
			var encodingSize = 1;
			while(Math.floor(maxInt/256)>0){
				encodingSize++;
				maxInt = Math.floor(maxInt/256);
			}
			
			var result = String.fromCharCode(encodingSize);
			var errortrack = "";
			for(i in compressed_asArray){
				var number = compressed_asArray[i];
				errortrack += "\n";
				for(d = 0; d < encodingSize; d++){
					var c = String.fromCharCode(number % 256);
					errortrack += c;
					result = result + c;
					number = Math.floor(number/256);
				}
				errortrack += "\t"+compressed_asArray[i];
			}
			console.log(errortrack);
			return result;
		},
		
		decompress: function(compressed){
			var encodingSize = compressed.charCodeAt(0);
			
			var compressed_asArray = [];
			for(i=1; i<compressed.length; i+=encodingSize){
				var number = 0;
				for(d = 0; d < encodingSize; d++){
					number += Math.pow(256,d)*compressed.charCodeAt(i+d);
				}
				compressed_asArray.push(number);
			}
			
			return json_graph_api.compactor.lzwdecompress(compressed_asArray);
		},
		
		// LZW compression
		// Code from there : http://rosettacode.org/wiki/LZW_compression#JavaScript
		lzwcompress: function (uncompressed) {
			"use strict";
			// Build the dictionary.
			var i,
				dictionary = {},
				c,
				wc,
				w = "",
				result = [],
				dictSize = 256;
			for (i = 0; i < 256; i += 1) {
				dictionary[String.fromCharCode(i)] = i;
			}
			for (i = 0; i < uncompressed.length; i += 1) {
				c = uncompressed.charAt(i);
				wc = w + c;
				if (dictionary[wc]) {
					w = wc;
				} else {
					result.push(dictionary[w]);
					// Add wc to the dictionary.
					dictionary[wc] = dictSize++;
					w = String(c);
				}
			}
			// Output the code for w.
			if (w !== "") {
				result.push(dictionary[w]);
			}
			return result;
		},
	 
	 
		lzwdecompress: function (compressed) {
			"use strict";
			
			// Build the dictionary.
			var i,
				dictionary = [],
				w,
				result,
				k,
				entry = "",
				dictSize = 256;
			for (i = 0; i < 256; i += 1) {
				dictionary[i] = String.fromCharCode(i);
			}
			w = String.fromCharCode(compressed[0]);
			result = w;
			for (i = 1; i < compressed.length; i += 1) {
				k = compressed[i];
				if (dictionary[k]) {
					entry = dictionary[k];
				} else {
					if (k === dictSize) {
						entry = w + w.charAt(0);
					} else {
						return null;
					}
				}
	 
				result += entry;
	 
				// Add w+entry[0] to the dictionary.
				dictionary[dictSize++] = w + entry.charAt(0);
	 
				w = entry;
			}
			return result;
		}
	}*/
}