jQuery(document).ready ($)->

	$.initializeDynatable = (opts)->

		element 		= opts.element

		if not _.isEmpty opts.customFilters
			createFilterElements opts.customFilters

		defaults=
			ajax 				: false
			ajaxUrl 			: false
			customQueries 		: []
			records 			: []
			queryRecordCount 	: 'queryRecordCount'
			totalRecordCount 	: 'totalRecordCount'
			perPageDefault 		: 10
			perPageOptions 		: [10,20,50,100]

		_.defaults opts, defaults

		element.find '.dynaTable'
			.bind 'dynatable:init', (e, dynatable)->
				_.each opts.customQueries, (queryFn,index)->
					dynatable.queries.functions[index] = queryFn

			.dynatable
				features: 
					paginate 			: true,
					recordCount 		: true,
					sorting				: true
					pushState			: false
					search 				: true
					perPageSelect 		: true

				table:
					headRowSelector 	: 'thead tr:first-child'

				dataset:
					ajax 				: opts.ajax
					ajaxUrl 			: opts.ajaxUrl
					ajaxOnLoad 			: true
					records 			: opts.records
					perPageDefault		: opts.perPageDefault
					queries 			: 'queries'
					queryRecordCount 	: opts.queryRecordCount
					totalRecordCount 	: opts.totalRecordCount	
					perPageOptions 		: opts.perPageOptions

				inputs: 
					queries: opts.element.find '.filters'
					queryEvent: 'keyup blur change'

				params:
					queries: 'queries'

				customFilters 		: opts.customFilters

				wrapper 	: opts.element

	createFilterElements=(customfilters)->

		_.each customfilters.filters, (filter)->

			html = ''

			switch filter.elementType

				when 'select'
					html +="<div><label>#{filter.label}: </label>" if filter.label
					html +="<select class='#{filter.attribute}Filter filters' data-dynatable-query='#{filter.attribute}'>
								<option value='' selected>--</option>
							</select>
						</div><br>"

				when 'checkbox','radio'
					html +="<div class='#{filter.attribute}Filter'>
							<label>#{filter.label}: </label>
					</div><br>"
			if filter.wrapper
				filter.wrapper.append html
			else
				customfilters.wrapper.append html

	$.processSearchFilters =(e, element)->
		dynatable = element.data('dynatable')
		functions = dynatable.queries.functions
		attrName= $(e.target).attr 'data-search-query'
		value  = $(e.target).val()
		if not _.has functions, attrName
			functions[attrName] = (record,queryValue)->
				attrValue = record[attrName]
				if _.isString(attrValue) and (attrValue.toLowerCase().indexOf(queryValue.toLowerCase()) isnt -1)
					contains = true
		
		if value then dynatable.queries.add(attrName, value) else dynatable.queries.remove(attrName)

		dynatable.process()

	$(document).on "dynatable:init", (e, dynatable)->

		records= dynatable.settings.dataset.records
		customFilters = dynatable.settings.customFilters

		if not _.isEmpty(customFilters) and not _.isEmpty customFilters.filters

			_.each customFilters.filters, (filter)->

				uniqRecs = _.uniq _.pluck records, filter.attribute
				uniqRecs = _.sortBy uniqRecs
				
				html  = ''

				switch filter.elementType
					when 'select'
						if filter.values
							html += "<option value=#{item}>#{item}</option>" for item in filter.values

						else if filter.range
							maxRec = parseInt _.max uniqRecs
							minimum = if filter.minimum then filter.minimum else 0
							range = _.range minimum, maxRec, filter.range
							html += "<option value=#{num}-#{num+filter.range}>#{num+1} to #{num+filter.range}</option>" for num in range

							dynatable.queries.functions[filter.attribute] = (record,queryValue)->
								values 	= queryValue.split '-'
								parseInt(record[filter.attribute]) >= parseInt(values[0]) and  parseInt(record[filter.attribute]) < parseInt(values[1])

						else
							html += "<option value=#{item}>#{item}</option>" for item in uniqRecs

					when 'radio','checkbox'
						if filter.values
							html += " <input type='#{filter.elementType}' value=#{item} name=#{filter.attribute}> <span class='capital'>#{item}</span>" for item in filter.values
						else
							html += " <input type='#{filter.elementType}' value=#{item} name=#{filter.attribute}> <span class='capital'>#{item}</span>" for item in uniqRecs

						if filter.elementType is 'checkbox'
							dynatable.queries.functions[filter.attribute] = (record,queryValue)->
								_.contains queryValue, record[filter.attribute]

				$(dynatable.settings.wrapper).find '.'+filter.attribute+'Filter'
				.append html