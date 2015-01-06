# coffescript code here

jQuery(document).ready ($)->

	################## Client Side Pagination & Sorting ##################

	class DynaPageLoadCtrl extends Ajency.RegionController
		
		initialize  :(options)->

			@options = options

			@userCollection = new Backbone.Collection()

			$.ajax
				url: 'users.json'

			.done (data)=>
				@userCollection.reset data.records

				@userCollection.each (model)-> 
					model.set 'action': '<a href="#view/'+model.get('_id')+'">view</a> | <a href="#edit/'+model.get('_id')+'">edit</a>'

				@view = view = @_getView @userCollection 
				@show @view 

		_getView:(userCollection)->
			new ShowUserTable
				collection :  userCollection

	class ShowUserTable extends Marionette.ItemView
		template : '<div class="customFilters"></div>
					<!--<select class="filters" id="age"><option>20</option><option>40</option></select>-->
					<table class="dynaTable" id="testt1">
					<thead>
						<tr>
							<th>Name</th>
							<th>Age</th>
							<th data-dynatable-column="registered" data-dynatable-type="date" data-dynatable-sorts="registered">Sign Up Date</th>
							<th>Gender</th>
							<th>Society</th>
							<th>Action</th>
						</tr>
						<tr>
							<th>
								<input class="srch-filters" size=5 data-search-query="name" type = "text" style="color:#000">
							</th>
							<th id="ageHeader"></th>
							<th id="registered"></th>
							<th></th>
							<th>
								<input class="srch-filters" size=5 data-search-query="society" type = "text" style="color:#000">
							</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
					</tbody>
					</table>'

		className: 'dynaWrapper'

		events:
			'change .customFilters input[type="radio"]' :(e)->
				attribute = $(e.target).attr 'name'
				dynatable= @$el.find('table').data 'dynatable'
				dynatable.queries.add attribute, $(e.target).val()
				dynatable.process()

			'change .customFilters input[type="checkbox"]' :(e)->
				attribute = $(e.target).attr 'name'
				dynatable= @$el.find('table').data 'dynatable'

				checkedItems= $ "input[name=#{e.target.name}]:checked"
				values = _.map checkedItems, (m)-> $(m).val()

				if not _.isEmpty values 
					dynatable.queries.add attribute, values
				else
					dynatable.queries.remove attribute

				dynatable.process()

			'keyup .srch-filters' 	:(e)->$.processSearchFilters e, @$el.find 'table'

			'change .srch-filters' 	:(e)->$.processSearchFilters e, @$el.find 'table'

			'blur .srch-filters' 	:(e)->$.processSearchFilters e, @$el.find 'table'

		onShow:->

			customFilters=
				wrapper : @$el.find '.customFilters'
				filters :
					ageFilter :
						#label 		: 'Choose Age Group'
						attribute 	: 'age'
						elementType	: 'select'
						range 		: 10
						minimum 	: 10
						wrapper 	: @$el.find 'th#ageHeader'
						className 	: 'form-control'

					genderFilter :
						label 		: 'Select Gender'
						attribute 	: 'gender'
						elementType	: 'radio'

					societyFilter : 
						label 		: 'Select Society'
						attribute 	: 'society'
						elementType	: 'checkbox'

					societyFilter : 
						attribute 	: 'registered'
						elementType	: 'date'
						wrapper 	: @$el.find 'th#registered'

			$.initializeDynatable
				element			: @$el
				ajax 			: false
				perPage			: 5
				records 		: @collection.toJSON()
				totalRecordCount: @collection.length
				customFilters	: customFilters
				idAttr 			: '_id'
				defaultSort 	: 'name' : -1
				dateFormat 		: 'dddd, dd mmm, yyyy' #Thursday, 22 Jan, 2015
				

	################## End of Client Side Pagination & Sorting ##################


	################## Server Side Pagination & Sorting #########################


	class DynaAjaxCtrl extends Ajency.RegionController

		initialize  :->
			@view = view = @_getView()
			@show @view 

		_getView:->
			new ShowAjaxUserTable()

	class ShowAjaxUserTable extends Marionette.ItemView
		template : '<div class="customFilters"></div>

					<table id="testt2" class="dynaTable">
					<thead>
						<th data-dynatable-column="display_name">Name</th>
						<th>Age</th>
						<th data-dynatable-column="registered">Sign Up Date</th>
						<th>Sex</th>
						<th>Society</th>
					</thead>
					<tbody>
					</tbody>
					</table>'

		className: 'dynaWrapper'

		events:
			'change input[name="gender"]' :(e)->
				@$el.find '#gender'
				.val $(e.target).val()
				.trigger 'change'

		onShow:->

			customFilters=
				wrapper : @$el.find '.customFilters'
				filters :
					ageFilter :
						label 		: 'Choose Age Group'
						attribute 	: 'age'
						elementType	: 'select'
						range 		: 10
						values 		: ['0-10','10-20','20-30','30-40']

					genderFilter :
						label 		: 'Select Gender'
						attribute 	: 'gender'
						elementType	: 'radio'
						values 		: ['male','female']

					societyFilter : 
						label 		: 'Select Society'
						attribute 	: 'society'
						elementType	: 'select'
						values 		: ['chess','cricket','football','polo','music']			

			$.initializeDynatable
				element	: @$el
				ajax 	: true
				ajaxUrl : 'http://localhost/euc/wp-json/dyna-users'
				perPageDefault	: 5				
				perPageOptions : [5,10,15,20]
				customFilters	: customFilters

	################## End of Server Side Pagination & Sorting ##################

	################## Initializing Marionette App ##############################

	App = new Marionette.Application()

	App.addRegions
		a : '#pageload'
		b : '#ajax'

	App.addInitializer ->
		new DynaPageLoadCtrl region : App.a
		#new DynaAjaxCtrl region : App.b


	App.start()