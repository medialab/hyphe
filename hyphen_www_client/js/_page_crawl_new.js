;(function(Hyphen, $, undefined){
    
    // On load
	$(document).ready(function(){

		// Update web entities list on load
		Hyphen.controller.core.webEntities_update()
		// Web entities selector (select2)
		var webentity_format = function(state){
			if (!state.id)
				return state.text // optgroup
            return "<img src='res/icon-we-16.png'/> " + state.text
		}
		$("#webentities_selector").select2({
            query: function (query) {
                var data = {results: []}, i, j, s
                
                Hyphen.model.webEntities.getAll().forEach(function(we){
                	if(we.searchable.match(query.term))
                		data.results.push({id: we.id, text: we.name});
                })
                query.callback(data);
            },
            placeholder: "Select an existing web entity",
            allowClear: true,
            formatResult: webentity_format,
            formatSelection: webentity_format
        })

	})


    /// Model

    /// View

    // Choosing an existing web entity with the select2
    $("#webentities_selector").on("change", function(e){
        Hyphen.controller.core.selectWebEntity( $("#webentities_selector").val() )
    })

    

    /// Controller
    
    Hyphen.controller.core.selectWebEntity = function(we_id){
        Hyphen.model.vars.set('focused_webentity_id', we_id)
        $(document).trigger( "/webentity_focus", [{what:'updated'}])
    }


})(window.Hyphen = window.Hyphen || {}, jQuery)