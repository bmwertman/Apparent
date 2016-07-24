Pta.directive('contactpicker', [
    '$q',
    '$filter',
    '$timeout',
    '$window',
    '$http',
    '$cordovaContacts',
    '$firebaseArray',
    'userService',
    'userFilter',
    function ($q, $filter, $timeout, $window, $http, $cordovaContacts, $firebaseArray, userService, userFilter) {
        'use strict'
        return {
            restrict: 'EAC',
            replace: true,
            transclude: true,
            templateUrl: 'templates/contactpicker.html',
            scope: {
                name:                   '@?',
                value:                  '=model',
                disabled:               '=?disable',
                required:               '=?require',
                multiple:               '=?multi',
                placeholder:            '@?',
                valueAttr:              '@',
                labelAttr:              '@?',
                groupAttr:              '@?',
                options:                '=?',
                create:                 '&?',
                rtl:                    '=?',
                api:                    '=?',
                change:                 '&?',
                removeButton:           '=?',
                softDelete:             '=?',
                viewItemTemplate:       '=?',
                dropdownItemTemplate:   '=?',
                dropdownCreateTemplate: '=?',
                dropdownGroupTemplate:  '=?'
            },
            link: function (scope, element, attrs, controller, transclude) {
                transclude(scope, function (clone, scope) {
                    var input        = angular.element(element[0].querySelector('.selector-input input')),
                        dropdown     = angular.element(element[0].querySelector('.selector-dropdown')),
                        initDeferred = $q.defer(),
                        defaults     = {
                            api:                    {},
                            search:                 '',
                            selectedValues:         [],
                            valueAttr:              null,
                            labelAttr:              'label',
                            groupAttr:              'group',
                            options:                [],
                            removeButton:           true,
                            viewItemTemplate:       'templates/item-default.html',
                            dropdownItemTemplate:   'templates/item-default.html',
                            dropdownCreateTemplate: 'templates/item-create.html',
                            dropdownGroupTemplate:  'templates/group-default.html'
                        };
                    var KEYS = {
                        backspace: 8,  
                        // up: 38, 
                        // down: 40, 
                        // left: 37, 
                        // right: 39, 
                        // escape: 27, 
                        // enter: 13, 
                        // delete: 46, 
                        // shift: 16, 
                        // leftCmd: 91, 
                        // rightCmd: 93, 
                        // ctrl: 17, 
                        // alt: 18, 
                        // tab: 9 
                    };

                    scope.keydown = function (e) {
                        switch (e.keyCode) {
                            // case KEYS.up:
                            //     if (!scope.isOpen) break;
                            //     scope.decrementHighlighted();
                            //     e.preventDefault();
                            //     break;
                            // case KEYS.down:
                            //     if (!scope.isOpen) scope.open();
                            //     else scope.incrementHighlighted();
                            //     e.preventDefault();
                            //     break;
                            // case KEYS.escape:
                            //     scope.highlight(0);
                            //     scope.close();
                            //     break;
                            // case KEYS.enter:
                            //     if (scope.isOpen) {
                            //         if (attrs.create && scope.search && scope.highlighted == -1)
                            //             scope.createOption(e.target.value);
                            //         else
                            //             if (scope.filteredOptions.length)
                            //                 scope.set();
                            //         e.preventDefault();
                            //     }
                            //     break;
                            case KEYS.backspace:
                                if (!input.val()) {
                                    var search = (scope.selectedValues.slice(-1)[0] || {})[scope.labelAttr] || '';
                                    scope.unset();
                                    scope.open();
                                    if (scope.softDelete) {
                                        scope.search = search;
                                        if (scope.multiple) e.preventDefault();
                                    }
                                }
                                break;
                            // case KEYS.left:
                            // case KEYS.right:
                            // case KEYS.shift:
                            // case KEYS.ctrl:
                            // case KEYS.alt:
                            // case KEYS.tab:
                            // case KEYS.leftCmd:
                            // case KEYS.rightCmd:
                            //     break;
                            default:
                                if (!scope.multiple && scope.hasValue()) {
                                    e.preventDefault();
                                } else {
                                    scope.open();
                                    // scope.highlight(0);
                                }
                                break;
                        }
                    };

                    scope.searchContacts = function(){
                        // Disabled phone contacts search in favor of only searching registered users 
                        // at the parent's associated school
                        // if(scope.isAdmin && !scope.searchSchool){
                        //     $cordovaContacts.find({
                        //         filter: document.getElementById('contactsInput').value,
                        //         multiple: true,
                        //         fields: ['displayName', 'name']
                        //     })
                        //     .then(function(contactsFound){
                        //         var nameRegEx = /^([a-z0-9_\.-]+)@/g;
                        //         angular.forEach(contactsFound, function(value, key){
                        //             if(value.emails && value.displayName && !nameRegEx.test(value.displayName)){
                        //                 var contact = {};
                        //                 contact.email = value.emails[0].value
                        //                 contact.id = parseInt(value.id);
                        //                 contact.label = value.displayName + " " + "<" + value.emails[0].value + ">"
                        //                 scope.options.push(contact);
                        //             }
                        //         });
                        //     });
                        // } else {
                        var user = userService.getUser();
                        var users = firebase.database().ref('users');
                        var school = $firebaseArray(users.orderByChild('school').equalTo(user.school));
                        school.$loaded()
                        .then(function(schoolParents){
                            scope.options = userFilter(schoolParents, scope.search);
                        });
                    }

                    function getStyles(element) {
                        return !(element instanceof HTMLElement) ? {} :
                            element.ownerDocument && element.ownerDocument.defaultView.opener
                                ? element.ownerDocument.defaultView.getComputedStyle(element)
                                : window.getComputedStyle(element);
                    }
                    
                    // Default attributes
                    if (!angular.isDefined(scope.value))
                        scope.value = scope.multiple ? [] : '';
                    angular.forEach(defaults, function (value, key) {
                        if (!angular.isDefined(scope[key])) scope[key] = value;
                    });
                    angular.forEach(['name', 'valueAttr', 'labelAttr'], function (attr) {
                        if (!attrs[attr]) attrs[attr] = scope[attr];
                    });
                    
                    // Options' utilities
                    scope.optionValue = function (option) {
                        return scope.valueAttr == null ? option : option[scope.valueAttr];
                    };
                    scope.optionEquals = function (option, value) {
                        return angular.equals(scope.optionValue(option), angular.isDefined(value) ? value : scope.value);
                    };
                    
                    // Value utilities
                    scope.setValue = function (value) {
                        var emailRegex = /<(.*?)\>/g;
                        var nameValue = emailRegex.exec(value);
                        if (!scope.multiple) scope.value = scope.valueAttr == null ? (nameValue || {}) : (nameValue || {})[scope.valueAttr];
                        else scope.value = scope.valueAttr == null ? (nameValue || []) : (nameValue || []).map(function (option) { return option[scope.valueAttr]; });
                    };
                    scope.hasValue = function () {
                        return scope.multiple ? (scope.value || []).length > 0 : (scope.valueAttr == null ? !angular.equals({}, scope.value) : !!scope.value);
                    };
                   
                    scope.fillWithHtml = function () {
                        scope.options = [];
                        angular.forEach(clone, function (element) {
                            var tagName = (element.tagName || '').toLowerCase();
                            if (tagName == 'option') scope.optionToObject(element);
                            if (tagName == 'optgroup') {
                                angular.forEach(element.querySelectorAll('option'), function (option) {
                                    scope.optionToObject(option, (element.attributes.name || {}).value);
                                });
                            }
                        });
                        scope.updateSelected();
                    };
                    
                    // Initialization
                    scope.initialize = function () {
                        if (!angular.isArray(scope.options) || !scope.options.length)
                            scope.fillWithHtml();
                        if (scope.hasValue()) {
                            if (!scope.multiple) {
                                if (angular.isArray(scope.value)) scope.value = scope.value[0];
                            } else {
                                if (!angular.isArray(scope.value)) scope.value = [scope.value];
                            }
                            scope.updateSelected();
                            scope.filterOptions();
                            scope.updateValue();
                        }
                    };
                    scope.$watch('multiple', function () {
                        $timeout(scope.setInputWidth);
                        initDeferred.promise.then(scope.initialize, scope.initialize);
                    });
                    
                    // Dropdown utilities
                    scope.dropdownPosition = function () {
                        var label       = input.parent()[0],
                            styles      = getStyles(label),
                            marginTop   = parseFloat(styles.marginTop || 0),
                            marginLeft  = parseFloat(styles.marginLeft || 0);
                        
                        dropdown.css({
                            top:   (label.offsetTop + label.offsetHeight + marginTop) + 'px',
                            left:  (label.offsetLeft + marginLeft) + 'px',
                            width: label.offsetWidth + 'px'
                        });
                    };
                    scope.open = function () {
                        scope.isOpen = true;
                        scope.dropdownPosition();
                    };
                    scope.close = function () {
                        scope.isOpen = false;
                        scope.resetInput();
                    };

                    scope.createOption = function (value) {
                        var option = {};
                        if (angular.isFunction(scope.create)) {
                            option = scope.create({ input: value });
                        } else {
                            option[scope.labelAttr] = value;
                            option[scope.valueAttr || 'value'] = value;
                        }
                        scope.options.push(option);
                        scope.set(option);
                    };
                    scope.set = function (option) {
                        var nameRegEx = /[A-Z][ a-zA-Z]*/g;
                        if (!angular.isDefined(option))
                            option = scope.filteredOptions[this.$index];
                        if (!scope.multiple) scope.selectedValues = [option];
                        else {
                            if (scope.selectedValues.indexOf(option) < 0)
                                option.label = nameRegEx.exec(option.label);
                                scope.selectedValues.push(option);
                        }
                        if (!scope.multiple) scope.close();
                        scope.resetInput();
                    };
                    scope.unset = function (index) {
                        if (!scope.multiple) scope.selectedValues = [];
                        else scope.selectedValues.splice(angular.isDefined(index) ? index : scope.selectedValues.length - 1, 1);
                        scope.resetInput();
                    };
                    
                    // Filtered options
                    scope.inOptions = function (options, value) {
                        return options.indexOf(value) >= 0;
                    };
                    scope.filterOptions = function () {
                        scope.filteredOptions = scope.options;
                        if (scope.multiple)
                            scope.filteredOptions = scope.filteredOptions.filter(function (option) {
                                var selectedValues = angular.isArray(scope.selectedValues) ? scope.selectedValues : [scope.selectedValues];
                                return !scope.inOptions(selectedValues, option);
                            });
                    };
                    
                    // Input width utilities
                    scope.measureWidth = function () {
                        var width,
                            styles = getStyles(input[0]),
                            shadow = angular.element('<span class="selector-shadow"></span>');
                        shadow.text(input.val() || (!scope.hasValue() ? scope.placeholder : '') || '');
                        angular.element(document.body).append(shadow);
                        angular.forEach(['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'textTransform', 'wordSpacing', 'textIndent'], function (style) {
                            shadow.css(style, styles[style]);
                        });
                        width = shadow[0].offsetWidth;
                        shadow.remove();
                        return width;
                    };
                    scope.setInputWidth = function () {
                        var width = scope.measureWidth() + 1;
                        input.css('width', width + 'px');
                    };
                    scope.resetInput = function () {
                        input.val('');
                        scope.search = '';
                        scope.setInputWidth();
                    };
                    
                    scope.$watch('[search, options, value]', function () {
                        // Remove selected items
                        scope.filterOptions();
                        $timeout(function () {
                            // set width
                            scope.setInputWidth();
                            // Repositionate dropdown
                            if (scope.isOpen) scope.dropdownPosition();
                        });
                    }, true);
                    
                    // Update value
                    scope.updateValue = function (origin) {
                        if (!angular.isDefined(origin)) origin = scope.selectedValues;
                        scope.setValue(!scope.multiple ? origin[0] : origin);
                    };
                    scope.$watch('selectedValues', function (newValue, oldValue) {
                        if (angular.equals(newValue, oldValue)) return;
                        scope.updateValue();
                        if (angular.isFunction(scope.change))
                            scope.change(scope.multiple
                                ? { newValue: newValue, oldValue: oldValue }
                                : { newValue: newValue[0], oldValue: oldValue[0] });
                    }, true);
                    scope.$watchCollection('options', function (newValue, oldValue) {
                        if (angular.equals(newValue, oldValue)) return;
                        scope.updateSelected();
                    });
                    
                    // Update selected values
                    scope.updateSelected = function () {
                        if (!scope.multiple) scope.selectedValues = (scope.options || []).filter(function (option) { return scope.optionEquals(option); }).slice(0, 1);
                        else
                            scope.selectedValues = (scope.value || []).map(function (value) {
                                return $filter('filter')(scope.options, function (option) {
                                    return scope.optionEquals(option, value);
                                })[0];
                            }).filter(function (value) { return angular.isDefined(value); });
                    };
                    scope.$watch('value', function (newValue, oldValue) {
                        if (angular.equals(newValue, oldValue)) return;
                        if (scope.options.length > 0) scope.updateSelected();
                        scope.filterOptions();
                        scope.updateValue();
                    }, true);
                    
                    // DOM event listeners
                    input = angular.element(element[0].querySelector('.selector-input input'))
                        .on('focus', function () {
                            $timeout(function () {
                                scope.$apply(scope.open);
                            });
                        })
                        .on('blur', function () {
                            scope.$apply(scope.close);
                        })
                        .on('keydown', function (e) {
                            scope.$apply(function () {
                                scope.keydown(e);
                            });
                        })
                        .on('input', function () {
                            scope.setInputWidth();
                        });
                    angular.element($window)
                        .on('resize', function () {
                            scope.dropdownPosition();
                        });
                    
                    // Expose APIs
                    angular.forEach(['open', 'close', 'fetch'], function (api) {
                        scope.api[api] = scope[api];
                    });
                    scope.api.focus = function () {
                        input[0].focus();
                    };
                    scope.api.set = function (value) {
                        var search = (scope.filteredOptions || []).filter(function (option) { return scope.optionEquals(option, value); });
                        
                        angular.forEach(search, function (option) {
                            scope.set(option);
                        });
                    };
                    scope.api.unset = function (value) {
                        var values  = !value ? scope.selectedValues : (scope.selectedValues || []).filter(function (option) { return scope.optionEquals(option, value); }),
                            indexes =
                                scope.selectedValues.map(function (option, index) {
                                    return scope.inOptions(values, option) ? index : -1;
                                }).filter(function (index) { return index >= 0; });
                        
                        angular.forEach(indexes, function (index, i) {
                            scope.unset(index - i);
                        });
                    };
                });
            }
        }
}]);
angular.module('templates/contactpicker.html', []).run(['$templateCache', function ($templateCache) {
    $templateCache.put('templates/contactpicker.html',
        '<div class="selector-container" ng-attr-dir="{{rtl ? \'rtl\' : \'ltr\'}}" ' +
            'ng-class="{open: isOpen, empty: !filteredOptions.length && (!create || !search), multiple: multiple, \'hasvalue\': hasValue(), rtl: rtl, ' +
                'loading: loading, \'removebutton\': removeButton, disabled: disabled}">' +
            '<select name="{{name}}" ng-hide="true" ' +
                'ng-model="selectedValues" multiple ng-options="option as option[labelAttr] for option in selectedValues" ng-hide="true"></select>' +
            '<label class="selector-input">' +
                '<ul class="selector-values">' +
                    '<li ng-repeat="(index, option) in selectedValues track by index">' +
                        '<div ng-include="viewItemTemplate"></div>' +
                        '<div ng-if="multiple" class="selector-helper" ng-click="!disabled && unset(index)">' +
                            '<span class="selector-icon"></span>' +
                        '</div>' +
                    '</li>' +
                '</ul>' +
                '<input ng-keyup="searchContacts()" id="contactsInput" ng-model="search" placeholder="{{!hasValue() ? placeholder : \'\'}}" ng-disabled="disabled" ng-required="required && !hasValue()">' +
                '<div ng-if="!multiple || loading" class="selector-helper selector-global-helper" ng-click="!disabled && removeButton && unset()">' +
                    '<span class="selector-icon"></span>' +
                '</div>' +
            '</label>' +
            '<ul class="selector-dropdown" ng-show="filteredOptions.length > 0 || (create && search)">' +
                '<li class="selector-option create" ng-if="create && search" ' +
                    'ng-include="dropdownCreateTemplate" ng-click="createOption(search)"></li>' +
                '<li ng-repeat-start="(index, option) in filteredOptions track by index" class="selector-optgroup" ' +
                    'ng-include="dropdownGroupTemplate" ng-show="option[groupAttr] && index == 0 || filteredOptions[index-1][groupAttr] != option[groupAttr]"></li>' +
                '<li ng-repeat-end ng-class="{grouped: option[groupAttr]}" class="selector-option" ' +
                    'ng-include="dropdownItemTemplate" ng-click="set()"></li>' +
            '</ul>' +
        '</div>'
    );
    $templateCache.put('templates/item-create.html', 'Add <i ng-bind="search"></i>');
    $templateCache.put('templates/item-default.html', '<span ng-bind="option[labelAttr] || option"></span>');
    $templateCache.put('templates/group-default.html', '<span ng-bind="option[groupAttr]"></span>');
}]);
    
