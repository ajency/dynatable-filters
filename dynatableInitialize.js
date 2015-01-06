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
      perPageSelect: true,
      defaultSort: [],
      dateFilterFormat: "dd/mm/yy",
      dateFormat: "Do MMM YYYY"
    };
    _.defaults(opts, defaults);
    return element.find('.dynaTable').bind('dynatable:init', function(e, dynatable) {
      _.each(opts.customQueries, function(queryFn, index) {
        return dynatable.queries.functions[index] = queryFn;
      });
      return dynatable.sorts.functions['date'] = function(a, b, attr, direction) {
        var comparison, date1, date2;
        date1 = moment(new Date(a[attr]));
        date2 = moment(new Date(b[attr]));
        comparison = date1.diff(date2);
        if (direction > 0) {
          return comparison;
        } else {
          return -comparison;
        }
      };
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
        perPageOptions: opts.perPageOptions,
        sorts: opts.defaultSort,
        dateFilterFormat: opts.dateFilterFormat,
        sortTypes: function() {
          var col_type, column, header, headers, sorts, _i, _len;
          sorts = [];
          headers = $(opts.element).find('table thead tr:first-child th');
          for (_i = 0, _len = headers.length; _i < _len; _i++) {
            header = headers[_i];
            col_type = $(header).attr('data-dynatable-type');
            column = $(header).attr('data-dynatable-column');
            if (col_type === 'date') {
              sorts[column] = 'date';
            }
          }
          return sorts;
        }
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
          var headers, tr;
          headers = $(opts.element).find('table thead tr:first-child th');
          tr = '';
          _.each(columns, (function(_this) {
            return function(col, index) {
              var col_type;
              col_type = $(headers[index]).attr('data-dynatable-type');
              return tr += cellWriter(col, record, col_type);
            };
          })(this));
          return '<tr data-id=' + record[opts.idAttr] + '>' + tr + '</tr>';
        },
        _cellWriter: function(column, record, col_type) {
          var html, td;
          html = column.attributeWriter(record);
          td = '<td';
          if (column.hidden || column.textAlign) {
            td += ' style="';
          }
          if (column.hidden) {
            td += 'display: none;';
          }
          if (column.textAlign) {
            td += 'text-align: ' + column.textAlign + ';';
            td += '"';
          }
          if (col_type === 'date' && !_.isUndefined(moment)) {
            html = moment(new Date(html)).format(opts.dateFormat);
          }
          return td + '>' + html + '</td>';
        }
      },
      customFilters: opts.customFilters,
      wrapper: opts.element
    });
  };
  createFilterElements = function(customfilters) {
    return _.each(customfilters.filters, function(filter) {
      var html, wrapperElement;
      html = '';
      wrapperElement = filter.wrapper ? filter.wrapper : customfilters.wrapper;
      switch (filter.elementType) {
        case 'select':
          if (filter.label) {
            html += "<div><label>" + filter.label + ": </label>";
          }
          html += "<select class='" + filter.attribute + "Filter filters " + filter.className + "' data-dynatable-query='" + filter.attribute + "'> <option value='' selected>--Select--</option> </select> </div><br>";
          break;
        case 'checkbox':
        case 'radio':
          html += "<div class='" + filter.attribute + "Filter'> <label>" + filter.label + ": </label> </div><br>";
          break;
        case 'date':
          html += "<input class='srch-filters dyna-date-picker " + filter.className + "' size=5 data-dynatable-type='date' data-search-query='" + filter.attribute + "' data-dynatable-query='" + filter.attribute + "' type = 'text' style='color:#000'>";
      }
      return wrapperElement.append(html);
    });
  };
  $.processSearchFilters = function(e, element) {
    var attrName, dynatable, functions, searchType, value;
    dynatable = element.data('dynatable');
    functions = dynatable.queries.functions;
    attrName = $(e.target).attr('data-search-query');
    searchType = $(e.target).attr('data-dynatable-type');
    value = $(e.target).val();
    if (searchType === 'date') {
      functions[attrName] = function(record, queryValue) {
        var attrValue, contains;
        attrValue = moment(new Date(record[attrName])).format('YYYY-MM-DD');
        queryValue = moment(new Date(queryValue)).format('YYYY-MM-DD');
        if (attrValue === queryValue) {
          return contains = true;
        }
      };
    } else if (!_.has(functions, attrName)) {
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
    var customFilters, dateFilterFormat, records;
    records = dynatable.settings.dataset.records;
    if (_.isEmpty(records)) {
      return false;
    }
    customFilters = dynatable.settings.customFilters;
    if (!_.isEmpty(customFilters) && !_.isEmpty(customFilters.filters)) {
      _.each(customFilters.filters, function(filter) {
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
                html += "<option value=" + num + "-" + (num + filter.range) + ">" + num + " to " + (num + filter.range) + "</option>";
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
                html += " <input class='" + filter.className + "' type='" + filter.elementType + "' value=" + item + " name=" + filter.attribute + "> <span class='capital'>" + item + "</span>";
              }
            } else {
              for (_m = 0, _len4 = uniqRecs.length; _m < _len4; _m++) {
                item = uniqRecs[_m];
                html += " <input class='" + filter.className + "' type='" + filter.elementType + "' value=" + item + " name=" + filter.attribute + "> <span class='capital'>" + item + "</span>";
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
    if (dynatable) {
      dateFilterFormat = dynatable.settings.dataset.dateFilterFormat;
    }
    return $(e.target).closest('.dynaWrapper').find('.dyna-date-picker').pickadate({
      'container': $(e.target).closest('.dynaWrapper'),
      'selectYears': true,
      'selectMonths': true,
      'format': dateFilterFormat
    });
  });
  return $(document).on("dynatable:afterUpdate", function(e, rows) {
    var colspan;
    colspan = $(e.target).find('thead tr:first-child th').length;
    if (!rows) {
      return $(e.target).find('tbody').append("<tr><td colspan=" + colspan + ">No Records Found</td></tr>");
    }
  });
});
