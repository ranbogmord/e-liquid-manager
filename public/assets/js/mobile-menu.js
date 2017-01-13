!function ($) {
  $(document).on('click', '#mobile-menu-toggle', function (e) {
    e.preventDefault();

    $(this).toggleClass('open');
  });
}(jQuery);
