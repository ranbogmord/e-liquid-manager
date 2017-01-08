!function ($) {
  $.ajax({
    method: 'get',
    url: '/admin/statistics/popular-flavours',
    dataType: 'json'
  })
  .then(function (res) {
    var chart = c3.generate({
      bindto: '#flavour-stats',
      data: {
        json: res,
        type: 'bar',
        keys: {
          x: 'flavourName',
          value: ['value']
        },
        names: {
          value: 'Num. liquids'
        }
      },
      axis: {
        x: {
          type: 'category'
        }
      }
    });
  });
}(jQuery);
