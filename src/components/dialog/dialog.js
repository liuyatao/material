/**
 * @ngdoc module
 * @name material.components.dialog
 */
angular.module('material.components.dialog', [
  'material.animations',
  'material.services.compiler',
  'material.services.aria',
  'material.services.interimElement',
])
  .directive('materialDialog', [
    '$$rAF',
    MaterialDialogDirective
  ])
  .factory('$materialDialog', [
    '$timeout',
    '$rootElement',
    '$materialEffects',
    '$animate',
    '$materialAria',
    '$$interimElement',
    MaterialDialogService
  ]);

function MaterialDialogDirective($$rAF) {
  return {
    restrict: 'E',
    link: function(scope, element, attr) {
      $$rAF(function() {
        var content = element[0].querySelector('.dialog-content');
        if (content && content.scrollHeight > content.clientHeight) {
          element.addClass('dialog-content-overflow');
        }
      });
    }
  };
}

/**
 * @ngdoc service
 * @name $materialDialog
 * @module material.components.dialog
 *
 * @description
 * `$materialDialog` opens a dialog over the app and provides a simple promise API.
 *
 * ### Restrictions
 *
 * - The dialog is always given an isolate scope.
 * - The dialog's template must have an outer `<material-dialog>` element.
 *   Inside, use an element with class `dialog-content` for the dialog's content, and use
 *   an element with class `dialog-actions` for the dialog's actions.  
 *
 * @usage
 * <hljs lang="html">
 * <div ng-controller="MyController">
 *   <material-button ng-click="openDialog($event)">
 *     Open a Dialog from this button!
 *   </material-button>
 * </div>
 * </hljs>
 *
 * <hljs lang="js">
 * var app = angular.module('app', ['ngMaterial']);
 * app.controller('MyController', function($scope, $materialDialog) {
 *   $scope.openDialog = function($event) {
 *     $materialDialog.show({
 *       targetEvent: $event,
 *       controller: 'DialogController',
 *       template: 
 *         '<material-dialog>
 *         '  <div class="dialog-content">Hello!</div>' +
 *         '  <div class="dialog-actions">
 *         '    <material-button ng-click="closeDialog()">' +
 *         '      Close' +
 *         '    </material-button>' +
 *         '  </div>' +
 *         '</material-dialog>'
 *     });
 *   };
 * });
 * app.controller('DialogController', function($scope, $materialDialog) {
 *   $scope.closeDialog = function() {
 *     $materialDialog.hide();
 *   };
 * });
 * </hljs>
 *
 */

/**
 *
 * @ngdoc method
 * @name $materialDialog#show
 *
 * @description
 * Show a dialog with the specified options.
 *
 * @param {object} options An options object, with the following properties:
 *   - `templateUrl` - `{string=}`: The url of a template that will be used as the content
 *   of the dialog. 
 *   - `template` - `{string=}`: Same as templateUrl, except this is an actual template string.
 *   - `targetEvent` - `{DOMClickEvent=}`: A click's event object. When passed in as an option, 
 *     the location of the click will be used as the starting point for the opening animation
 *     of the the dialog.
 *   - `hasBackdrop` - `{boolean=}`: Whether there should be an opaque backdrop behind the dialog.
 *     Default true.
 *   - `clickOutsideToClose` - `{boolean=}`: Whether the user can click outside the dialog to
 *     close it. Default true.
 *   - `escapeToClose` - `{boolean=}`: Whether the user can press escape to close the dialog.
 *     Default true.
 *   - `controller` - `{string=}`: The controller to associate with the dialog. The controller
 *     will be injected with the local `$hideDialog`, which is a function used to hide the dialog.
 *   - `locals` - `{object=}`: An object containing key/value pairs. The keys will be used as names
 *     of values to inject into the controller. For example, `locals: {three: 3}` would inject
 *     `three` into the controller, with the value 3.
 *   - `resolve` - `{object=}`: Similar to locals, except it takes promises as values, and the
 *     toast will not open until all of the promises resolve.
 *   - `controllerAs` - `{string=}`: An alias to assign the controller to on the scope.
 *   - `parent` - `{element=}`: The element to append the dialog to. Defaults to appending
 *     to the root element of the application.
 *
 * @returns {promise} A promise that can be resolved with `$materialDialog.hide()` or
 * rejected with `materialDialog.cancel()`.
 */

/**
 * @ngdoc method
 * @name $materialDialog#hide
 *
 * @description
 * Hide an existing dialog and resolve the promise returned from `$materialDialog.show()`.
 *
 * @param {*=} response An argument for the resolved promise.
 *
 */

/**
 * @ngdoc method
 * @name $materialDialog#cancel
 *
 * @description
 * Hide an existing dialog and reject the promise returned from `$materialDialog.show()`.
 *
 * @param {*=} response An argument for the rejected promise.
 *
 */

function MaterialDialogService($timeout, $rootElement, $materialEffects, $animate, $materialAria, $$interimElement) {

  var $dialogService;
  return $dialogService = $$interimElement({
    hasBackdrop: true,
    isolateScope: true,
    onShow: onShow,
    onRemove: onRemove,
    clickOutsideToClose: true,
    escapeToClose: true,
    targetEvent: null,
    transformTemplate: function(template) {
      return '<div class="material-dialog-container">' + template + '</div>';
    }
  });

  function onShow(scope, element, options) {
    // Incase the user provides a raw dom element, always wrap it in jqLite
    options.parent = angular.element(options.parent);

    options.popInTarget = angular.element((options.targetEvent || {}).target); 
    var closeButton = findCloseButton();

    configureAria(element.find('material-dialog'));

    if (options.hasBackdrop) {
      var backdrop = angular.element('<material-backdrop class="opaque ng-enter">');
      $animate.enter(backdrop, options.parent, null);
      options.backdrop = backdrop;
    }

    return $materialEffects.popIn(
      element, 
      options.parent, 
      options.popInTarget.length && options.popInTarget
    )
    .then(function() {
      if (options.escapeToClose) {
        options.rootElementKeyupCallback = function(e) {
          if (e.keyCode === Constant.KEY_CODE.ESCAPE) {
            $timeout($dialogService.cancel);
          }
        };

        $rootElement.on('keyup', options.rootElementKeyupCallback);
      }

      if (options.clickOutsideToClose) {
        options.dialogClickOutsideCallback = function(e) {
          // Only close if we click the flex container outside the backdrop
          if (e.target === element[0]) {
            $timeout($dialogService.cancel);
          }
        };

        element.on('click', options.dialogClickOutsideCallback);
      }
      closeButton.focus();
    });


    function findCloseButton() {
      //If no element with class dialog-close, try to find the last
      //button child in dialog-actions and assume it is a close button
      var closeButton = element[0].querySelector('.dialog-close');
      if (!closeButton) {
        var actionButtons = element[0].querySelectorAll('.dialog-actions button');
        closeButton = actionButtons[ actionButtons.length - 1 ];
      }
      return angular.element(closeButton);
    }

  }

  function onRemove(scope, element, options) {

    if (options.backdrop) {
      $animate.leave(options.backdrop);
      element.data('backdrop', undefined);
    }
    if (options.escapeToClose) {
      $rootElement.off('keyup', options.rootElementKeyupCallback);
    }
    if (options.clickOutsideToClose) {
      element.off('click', options.dialogClickOutsideCallback);
    }
    return $animate.leave(element).then(function() {
      element.remove();
      options.popInTarget && options.popInTarget.focus();
    });

  }

  /**
   * Inject ARIA-specific attributes appropriate for Dialogs
   */
  function configureAria(element) {
    element.attr({
      'role': 'dialog'
    });

    var dialogContent = element.find('.dialog-content');
    if (dialogContent.length === 0){
      dialogContent = element;
    }
    var defaultText = Util.stringFromTextBody(dialogContent.text(), 3);
    $materialAria.expect(element, 'aria-label', defaultText);
  }
}
