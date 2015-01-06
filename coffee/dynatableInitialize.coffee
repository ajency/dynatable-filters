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
			idAttr 				: 'id'
			paginate 			: true
			recordCount 		: true
			sorting				: true
			pushState			: false
			search 				: true
			perPageSelect 		: true
			defaultSort 		: []
			dateFilterFormat	: "dd/mm/yy"
			dateFormat			: "Do MMM YYYY"

		_.defaults opts, defaults
		
		element.find '.dynaTable'
			.bind 'dynatable:init', (e, dynatable)->
				_.each opts.customQueries, (queryFn,index)->
					dynatable.queries.functions[index] = queryFn

				dynatable.sorts.functions['date']=(a, b, attr, direction)-> 
							date1 = moment new Date a[attr]
							date2 = moment new Date b[attr]
							comparison = date1.diff date2
							return if direction >0 then comparison  else -comparison

			.dynatable
				features: 
					paginate 			: opts.paginate
					recordCount 		: opts.recordCount
					sorting				: opts.sorting
					pushState			: opts.pushState
					search 				: opts.search
					perPageSelect 		: opts.perPageSelect

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
					sorts 				: opts.defaultSort
					dateFilterFormat 	: opts.dateFilterFormat

					sortTypes 			:-> 
						sorts = []
						headers= $(opts.element).find 'table thead tr:first-child th'
						for header in headers
							col_type= $(header).attr 'data-dynatable-type' 
							column= $(header).attr 'data-dynatable-column' 
							if col_type is 'date'
								sorts[column]='date'
						sorts

				inputs: 
					queries: opts.element.find '.filters'
					queryEvent: 'keyup blur change'

				params:
					queries: 'queries'

				writers:
					_rowWriter: (rowIndex, record, columns, cellWriter)->		
									headers= $(opts.element).find 'table thead tr:first-child th'				
									tr = '';
									_.each columns, (col,index)=>
										col_type= $(headers[index]).attr 'data-dynatable-type' 
										tr += cellWriter col, record, col_type

									'<tr data-id='+record[opts.idAttr]+'>' + tr + '</tr>';

					_cellWriter: (column, record, col_type)->
									html = column.attributeWriter(record)
									td = '<td';

									if column.hidden or column.textAlign
										td += ' style="';

									# keep cells for hidden column headers hidden
									if column.hidden
										td += 'display: none;'

									# keep cells aligned as their column headers are aligned
									if column.textAlign
										td += 'text-align: ' + column.textAlign + ';'
										td += '"';

									if col_type is 'date' and not _.isUndefined moment
										html = moment(new Date(html)).format opts.dateFormat

									td + '>' + html + '</td>'

				customFilters 		: opts.customFilters

				wrapper 	: opts.element

	createFilterElements=(customfilters)->

		_.each customfilters.filters, (filter)->

			html = ''

			wrapperElement= if filter.wrapper then filter.wrapper else customfilters.wrapper

			switch filter.elementType

				when 'select'
					html +="<div><label>#{filter.label}: </label>" if filter.label
					html +="<select class='#{filter.attribute}Filter filters #{filter.className}' data-dynatable-query='#{filter.attribute}'>
								<option value='' selected>--Select--</option>
							</select>
						</div><br>"

				when 'checkbox','radio'
					html +="<div class='#{filter.attribute}Filter'>
							<label>#{filter.label}: </label>
					</div><br>"

				when 'date'
					html +="<input class='srch-filters dyna-date-picker #{filter.className}' size=5 data-dynatable-type='date' data-search-query='#{filter.attribute}' data-dynatable-query='#{filter.attribute}' type = 'text' style='color:#000'>"
					
			wrapperElement.append html

	$.processSearchFilters =(e, element)->
		dynatable = element.data('dynatable')
		functions = dynatable.queries.functions
		attrName= $(e.target).attr 'data-search-query'
		searchType= $(e.target).attr 'data-dynatable-type'
		value  = $(e.target).val()
		if searchType is 'date'
			functions[attrName] = (record,queryValue)->
				attrValue 	= moment(new Date(record[attrName])).format 'YYYY-MM-DD'
				queryValue 	= moment(new Date(queryValue)).format 'YYYY-MM-DD'
				contains = true if attrValue is queryValue

		else if not _.has functions, attrName
			functions[attrName] = (record,queryValue)->
				attrValue = record[attrName]
				if _.isString(attrValue) and (attrValue.toLowerCase().indexOf(queryValue.toLowerCase()) isnt -1)
					contains = true
		
		if value then dynatable.queries.add(attrName, value) else dynatable.queries.remove(attrName)

		dynatable.process()

	$(document).on "dynatable:init", (e, dynatable)->

		records= dynatable.settings.dataset.records

		return false if _.isEmpty records

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
							html += "<option value=#{num}-#{num+filter.range}>#{num} to #{num+filter.range}</option>" for num in range

							dynatable.queries.functions[filter.attribute] = (record,queryValue)->
								values 	= queryValue.split '-'
								parseInt(record[filter.attribute]) >= parseInt(values[0]) and  parseInt(record[filter.attribute]) < parseInt(values[1])

						else
							html += "<option value=#{item}>#{item}</option>" for item in uniqRecs

					when 'radio','checkbox'
						if filter.values
							html += " <input class='#{filter.className}' type='#{filter.elementType}' value=#{item} name=#{filter.attribute}> <span class='capital'>#{item}</span>" for item in filter.values
						else
							html += " <input class='#{filter.className}' type='#{filter.elementType}' value=#{item} name=#{filter.attribute}> <span class='capital'>#{item}</span>" for item in uniqRecs

						if filter.elementType is 'checkbox'
							dynatable.queries.functions[filter.attribute] = (record,queryValue)->
								_.contains queryValue, record[filter.attribute]

				$(dynatable.settings.wrapper).find '.'+filter.attribute+'Filter'
				.append html

		dateFilterFormat= dynatable.settings.dataset.dateFilterFormat if dynatable

		$(e.target).closest '.dynaWrapper'
		.find '.dyna-date-picker'
		.pickadate 
			'container'		: $(e.target).closest '.dynaWrapper'
			'selectYears'	: true
			'selectMonths'	: true
			'format' 		: dateFilterFormat

	$(document).on "dynatable:afterUpdate", (e, rows)->

		colspan = $(e.target).find('thead tr:first-child th').length
		if not rows
			$(e.target).find('tbody').append "<tr><td colspan=#{colspan}>No Records Found</td></tr>"

