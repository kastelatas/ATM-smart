import Vue from 'vue'
import moment from 'moment'

Vue.filter('reverse', function (value) {
  // slice to make a copy of array, then reverse the copy
  return value.slice().reverse()
})

/* Vue.filter('formatDate', function (value) {
  if (value) {
    return moment(String(value)).fromNow()
  }
}) */

Vue.filter('formatDate', function (value) {
  if (value) {
    return moment(String(value)).format('ddd, D MMM')
  }
})

Vue.filter('formatInvoiceDate', function (value) {
  if (value) {
    return moment(String(value)).format('DD/MM/YYYY')
  }
})

Vue.filter('formatDateAssignments', function (value, lang) {
  if (value) {
    switch (lang) {
      case 'en' :
        moment.locale('en')
        break
      case 'sl':
        moment.locale('sl')
        break
    }
    return moment(String(value)).format('ddd, D MMM')
  }
})

Vue.filter('formatFullDate', function (value) {
  if (value) {
    return moment(String(value)).format('dddd, MMMM D, YYYY')
  }
})

Vue.filter('formatTime', function (value) {
  if (value) {
    return value + '\''
  }
})

Vue.filter('formatMoney', function (value) {
  if (value) {
    return '$' + value
  }
})
