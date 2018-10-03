'use strict';

// управляет пинами и карточками объявлений
(function () {
  var adFormElement = document.querySelector('.ad-form');
  var adFieldsetsElements = document.querySelectorAll('.ad-form-header, .ad-form__element');
  var adAddressElement = adFormElement.querySelector('[name=address]');
  var avatarChooserElement = adFormElement.querySelector('[name=avatar]');
  var imagesChooserElement = adFormElement.querySelector('[name=images]');
  var avatarElement = adFormElement.querySelector('.ad-form-header__preview img');
  var imagesElement = adFormElement.querySelector('.ad-form__photo');

  var mapElement = document.querySelector('.map');
  var mapFiltersFieldsElements = document.querySelectorAll('.map__filter, .map__features');

  var mainElement = document.querySelector('main');
  var errorTemplateElement = document.querySelector('#error')
      .content
      .querySelector('.error');

  var isGotPins = false;

  // функция деактивации полей
  var deactivateFields = function (arr, element, className) {
    arr.forEach(function (item) {
      item.setAttribute('disabled', '');
    });
    element.classList.add(className);
  };

  // функция активации полей
  var activateBlock = function (arr, element, className) {
    arr.forEach(function (item) {
      item.removeAttribute('disabled');
    });
    element.classList.remove(className);
  };

  // функция-коллбэк ошибки получения данных с сервера
  var onError = function (errorMessage) {
    window.utils.renderMessageElement(mainElement, errorTemplateElement, errorMessage);
    setInactiveState();
  };

  // функция-коллбэк успешного получения данных с сервера
  var onLoad = function (data) {
    window.pins.updatePins(data);
    window.filters.enableFilters(data);
    isGotPins = true;
  };

  // функция получает данные с сервера
  var getPins = function () {
    window.backend.load(onLoad, onError);
  };

  // функция приводит страницу в активное состоние
  var setActiveState = function () {
    getPins();
    activateBlock(mapFiltersFieldsElements, mapElement, 'map--faded');
    activateBlock(adFieldsetsElements, adFormElement, 'ad-form--disabled');
    window.enableFileChooser(avatarChooserElement, avatarElement);
    window.enableFileChooser(imagesChooserElement, imagesElement);
  };

  // функция изначально приводит страницу в неактивное состоние
  var setInactiveState = function () {
    deactivateFields(adFieldsetsElements, mapElement, 'map--faded');
    deactivateFields(mapFiltersFieldsElements, adFormElement, 'ad-form--disabled');
    if (isGotPins) {
      window.pins.deletePins();
      window.card.closePopup();
      isGotPins = false;
    }
    window.filters.resetFilters();
    window.main.resetMainPin();
    adAddressElement.value = window.main.getCoordsMainPin();
  };

  setInactiveState();

  // экспортируемый объект
  window.map = {
    setActiveState: setActiveState,
    setInactiveState: setInactiveState,
  };

})();
