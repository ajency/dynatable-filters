jQuery(document).ready(function($) {
  var createFilterElements;
  $.initializeDynatable = function(opts) {
    var defaults, element;
    element = opts.element;
    if (!_.isEmpty(opts.customFilters)) {
      createFilterElements(opts.customFilters);
    }
    defaults = {
      ajax: false,
      ajaxUrl: false,
      customQueries: [],
      records: [],
      queryRecordCount: 'queryRecordCount',
      totalRecordCount: 'totalRecordCount',
      perPageDefault: 10,
      perPageOptions: [10, 20, 50, 100],
      idAttr: 'id',
      paginate: true,
      recordCount: true,
      sorting: true,
      pushState: false,
      search: true,
      perPageSelect: true
    };
    _.defaults(opts, defaults);
    return element.find('.dynaTable').bind('dynatable:init', function(e, dynatable) {
      return _.each(opts.customQueries, function(queryFn, index) {
        return dynatable.queries.functions[index] = queryFn;
      });
    }).dynatable({
      features: {
        paginate: opts.paginate,
        recordCount: opts.recordCount,
        sorting: opts.sorting,
        pushState: opts.pushState,
        search: opts.search,
        perPageSelect: opts.perPageSelect
      },
      table: {
        headRowSelector: 'thead tr:first-child'
      },
      dataset: {
        ajax: opts.ajax,
        ajaxUrl: opts.ajaxUrl,
        ajaxOnLoad: true,
        records: opts.records,
        perPageDefault: opts.perPageDefault,
        queries: 'queries',
        queryRecordCount: opts.queryRecordCount,
        totalRecordCount: opts.totalRecordCount,
        perPageOptions: opts.perPageOptions
      },
      inputs: {
        queries: opts.element.find('.filters'),
        queryEvent: 'keyup blur change'
      },
      params: {
        queries: 'queries'
      },
      writers: {
        _rowWriter: function(rowIndex, record, columns, cellWriter) {
          var col, tr, _i, _len;
          tr = '';
          for (_i = 0, _len = columns.length; _i < _len; _i++) {
            col = columns[_i];
            tr += cellWriter(col, record);
          }
          return '<tr data-id=' + record[opts.idAttr] + '>' + tr + '</tr>';
        }
      },
      customFilters: opts.customFilters,
      wrapper: opts.element
    });
  };
  createFilterElements = function(customfilters) {
    return _.each(customfilters.filters, function(filter) {
      var html;
      html = '';
      switch (filter.elementType) {
        case 'select':
          if (filter.label) {
            html += "<div><label>" + filter.label + ": </label>";
          }
          html += "<select class='" + filter.attribute + "Filter filters' data-dynatable-query='" + filter.attribute + "'> <option value='' selected>--</option> </select> </div><br>";
          break;
        case 'checkbox':
        case 'radio':
          html += "<div class='" + filter.attribute + "Filter'> <label>" + filter.label + ": </label> </div><br>";
      }
      if (filter.wrapper) {
        return filter.wrapper.append(html);
      } else {
        return customfilters.wrapper.append(html);
      }
    });
  };
  $.processSearchFilters = function(e, element) {
    var attrName, dynatable, functions, value;
    dynatable = element.data('dynatable');
    functions = dynatable.queries.functions;
    attrName = $(e.target).attr('data-search-query');
    value = $(e.target).val();
    if (!_.has(functions, attrName)) {
      functions[attrName] = function(record, queryValue) {
        var attrValue, contains;
        attrValue = record[attrName];
        if (_.isString(attrValue) && (attrValue.toLowerCase().indexOf(queryValue.toLowerCase()) !== -1)) {
          return contains = true;
        }
      };
    }
    if (value) {
      dynatable.queries.add(attrName, value);
    } else {
      dynatable.queries.remove(attrName);
    }
    return dynatable.process();
  };
  $(document).on("dynatable:init", function(e, dynatable) {
    var customFilters, records;
    records = dynatable.settings.dataset.records;
    if (_.isEmpty(records)) {
      return false;
    }
    customFilters = dynatable.settings.customFilters;
    if (!_.isEmpty(customFilters) && !_.isEmpty(customFilters.filters)) {
      return _.each(customFilters.filters, function(filter) {
        var html, item, maxRec, minimum, num, range, uniqRecs, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1;
        uniqRecs = _.uniq(_.pluck(records, filter.attribute));
        uniqRecs = _.sortBy(uniqRecs);
        html = '';
        switch (filter.elementType) {
          case 'select':
            if (filter.values) {
              _ref = filter.values;
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                item = _ref[_i];
                html += "<option value=" + item + ">" + item + "</option>";
              }
            } else if (filter.range) {
              maxRec = parseInt(_.max(uniqRecs));
              minimum = filter.minimum ? filter.minimum : 0;
              range = _.range(minimum, maxRec, filter.range);
              for (_j = 0, _len1 = range.length; _j < _len1; _j++) {
                num = range[_j];
                html += "<option value=" + num + "-" + (num + filter.range) + ">" + (num + 1) + " to " + (num + filter.range) + "</option>";
              }
              dynatable.queries.functions[filter.attribute] = function(record, queryValue) {
                var values;
                values = queryValue.split('-');
                return parseInt(record[filter.attribute]) >= parseInt(values[0]) && parseInt(record[filter.attribute]) < parseInt(values[1]);
              };
            } else {
              for (_k = 0, _len2 = uniqRecs.length; _k < _len2; _k++) {
                item = uniqRecs[_k];
                html += "<option value=" + item + ">" + item + "</option>";
              }
            }
            break;
          case 'radio':
          case 'checkbox':
            if (filter.values) {
              _ref1 = filter.values;
              for (_l = 0, _len3 = _ref1.length; _l < _len3; _l++) {
                item = _ref1[_l];
                html += " <input type='" + filter.elementType + "' value=" + item + " name=" + filter.attribute + "> <span class='capital'>" + item + "</span>";
              }
            } else {
              for (_m = 0, _len4 = uniqRecs.length; _m < _len4; _m++) {
                item = uniqRecs[_m];
                html += " <input type='" + filter.elementType + "' value=" + item + " name=" + filter.attribute + "> <span class='capital'>" + item + "</span>";
              }
            }
            if (filter.elementType === 'checkbox') {
              dynatable.queries.functions[filter.attribute] = function(record, queryValue) {
                return _.contains(queryValue, record[filter.attribute]);
              };
            }
        }
        return $(dynatable.settings.wrapper).find('.' + filter.attribute + 'Filter').append(html);
      });
    }
  });
  return $(document).on("dynatable:afterUpdate", function(e, rows) {
    var colspan;
    colspan = $(e.target).find('thead tr:first-child th').length;
    if (!rows) {
      return $(e.target).find('tbody').append("<tr><td colspan=" + colspan + ">No Records Found</td></tr>");
    }
  });
});
