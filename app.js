var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

jQuery(document).ready(function($) {
  var App, DynaAjaxCtrl, DynaPageLoadCtrl, ShowAjaxUserTable, ShowUserTable;
  DynaPageLoadCtrl = (function(_super) {
    __extends(DynaPageLoadCtrl, _super);

    function DynaPageLoadCtrl() {
      return DynaPageLoadCtrl.__super__.constructor.apply(this, arguments);
    }

    DynaPageLoadCtrl.prototype.initialize = function(options) {
      this.options = options;
      this.userCollection = new Backbone.Collection();
      return $.ajax({
        url: 'users.json'
      }).done((function(_this) {
        return function(data) {
          var view;
          _this.userCollection.reset(data.records);
          _this.userCollection.each(function(model) {
            return model.set({
              'action': '<a href="#view/' + model.get('_id') + '">view</a> | <a href="#edit/' + model.get('_id') + '">edit</a>'
            });
          });
          _this.view = view = _this._getView(_this.userCollection);
          return _this.show(_this.view);
        };
      })(this));
    };

    DynaPageLoadCtrl.prototype._getView = function(userCollection) {
      return new ShowUserTable({
        collection: userCollection
      });
    };

    return DynaPageLoadCtrl;

  })(Ajency.RegionController);
  ShowUserTable = (function(_super) {
    __extends(ShowUserTable, _super);

    function ShowUserTable() {
      return ShowUserTable.__super__.constructor.apply(this, arguments);
    }

    ShowUserTable.prototype.template = '<div class="customFilters"></div> <!--<select class="filters" id="age"><option>20</option><option>40</option></select>--> <table class="dynaTable" id="testt1"> <thead> <tr> <th>Name</th> <th>Age</th> <th data-dynatable-column="registered" data-dynatable-type="date" data-dynatable-sorts="registered">Sign Up Date</th> <th>Gender</th> <th>Society</th> <th>Action</th> </tr> <tr> <th> <input class="srch-filters" size=5 data-search-query="name" type = "text" style="color:#000"> </th> <th id="ageHeader"></th> <th id="registered"></th> <th></th> <th> <input class="srch-filters" size=5 data-search-query="society" type = "text" style="color:#000"> </th> <th></th> </tr> </thead> <tbody> </tbody> </table>';

    ShowUserTable.prototype.className = 'dynaWrapper';

    ShowUserTable.prototype.events = {
      'change .customFilters input[type="radio"]': function(e) {
        var attribute, dynatable;
        attribute = $(e.target).attr('name');
        dynatable = this.$el.find('table').data('dynatable');
        dynatable.queries.add(attribute, $(e.target).val());
        return dynatable.process();
      },
      'change .customFilters input[type="checkbox"]': function(e) {
        var attribute, checkedItems, dynatable, values;
        attribute = $(e.target).attr('name');
        dynatable = this.$el.find('table').data('dynatable');
        checkedItems = $("input[name=" + e.target.name + "]:checked");
        values = _.map(checkedItems, function(m) {
          return $(m).val();
        });
        if (!_.isEmpty(values)) {
          dynatable.queries.add(attribute, values);
        } else {
          dynatable.queries.remove(attribute);
        }
        return dynatable.process();
      },
      'keyup .srch-filters': function(e) {
        return $.processSearchFilters(e, this.$el.find('table'));
      },
      'change .srch-filters': function(e) {
        return $.processSearchFilters(e, this.$el.find('table'));
      },
      'blur .srch-filters': function(e) {
        return $.processSearchFilters(e, this.$el.find('table'));
      }
    };

    ShowUserTable.prototype.onShow = function() {
      var customFilters;
      customFilters = {
        wrapper: this.$el.find('.customFilters'),
        filters: {
          ageFilter: {
            attribute: 'age',
            elementType: 'select',
            range: 10,
            minimum: 10,
            wrapper: this.$el.find('th#ageHeader'),
            className: 'form-control'
          },
          genderFilter: {
            label: 'Select Gender',
            attribute: 'gender',
            elementType: 'radio'
          },
          societyFilter: {
            label: 'Select Society',
            attribute: 'society',
            elementType: 'checkbox'
          },
          societyFilter: {
            attribute: 'registered',
            elementType: 'date',
            wrapper: this.$el.find('th#registered')
          }
        }
      };
      return $.initializeDynatable({
        element: this.$el,
        ajax: false,
        perPage: 5,
        records: this.collection.toJSON(),
        totalRecordCount: this.collection.length,
        customFilters: customFilters,
        idAttr: '_id',
        defaultSort: {
          'name': -1
        }
      });
    };

    return ShowUserTable;

  })(Marionette.ItemView);
  DynaAjaxCtrl = (function(_super) {
    __extends(DynaAjaxCtrl, _super);

    function DynaAjaxCtrl() {
      return DynaAjaxCtrl.__super__.constructor.apply(this, arguments);
    }

    DynaAjaxCtrl.prototype.initialize = function() {
      var view;
      this.view = view = this._getView();
      return this.show(this.view);
    };

    DynaAjaxCtrl.prototype._getView = function() {
      return new ShowAjaxUserTable();
    };

    return DynaAjaxCtrl;

  })(Ajency.RegionController);
  ShowAjaxUserTable = (function(_super) {
    __extends(ShowAjaxUserTable, _super);

    function ShowAjaxUserTable() {
      return ShowAjaxUserTable.__super__.constructor.apply(this, arguments);
    }

    ShowAjaxUserTable.prototype.template = '<div class="customFilters"></div> <table id="testt2" class="dynaTable"> <thead> <th data-dynatable-column="display_name">Name</th> <th>Age</th> <th data-dynatable-column="registered">Sign Up Date</th> <th>Sex</th> <th>Society</th> </thead> <tbody> </tbody> </table>';

    ShowAjaxUserTable.prototype.className = 'dynaWrapper';

    ShowAjaxUserTable.prototype.events = {
      'change input[name="gender"]': function(e) {
        return this.$el.find('#gender').val($(e.target).val()).trigger('change');
      }
    };

    ShowAjaxUserTable.prototype.onShow = function() {
      var customFilters;
      customFilters = {
        wrapper: this.$el.find('.customFilters'),
        filters: {
          ageFilter: {
            label: 'Choose Age Group',
            attribute: 'age',
            elementType: 'select',
            range: 10,
            values: ['0-10', '10-20', '20-30', '30-40']
          },
          genderFilter: {
            label: 'Select Gender',
            attribute: 'gender',
            elementType: 'radio',
            values: ['male', 'female']
          },
          societyFilter: {
            label: 'Select Society',
            attribute: 'society',
            elementType: 'select',
            values: ['chess', 'cricket', 'football', 'polo', 'music']
          }
        }
      };
      return $.initializeDynatable({
        element: this.$el,
        ajax: true,
        ajaxUrl: 'http://localhost/euc/wp-json/dyna-users',
        perPageDefault: 5,
        perPageOptions: [5, 10, 15, 20],
        customFilters: customFilters
      });
    };

    return ShowAjaxUserTable;

  })(Marionette.ItemView);
  App = new Marionette.Application();
  App.addRegions({
    a: '#pageload',
    b: '#ajax'
  });
  App.addInitializer(function() {
    return new DynaPageLoadCtrl({
      region: App.a
    });
  });
  return App.start();
});
