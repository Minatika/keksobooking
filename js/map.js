'use strict';

var cardParams = {
  COUNT: 8,
  TITLES: [
    'Большая уютная квартира',
    'Маленькая неуютная квартира',
    'Огромный прекрасный дворец',
    'Маленький ужасный дворец',
    'Красивый гостевой домик',
    'Некрасивый негостеприимный домик',
    'Уютное бунгало далеко от моря',
    'Неуютное бунгало по колено в воде'
  ],
  PRICE_MIN: 1000,
  PRICE_MAX: 1000000,
  TIME: ['12:00', '13:00', '14:00'],
  FEATURES: ['wifi', 'dishwasher', 'parking', 'washer', 'elevator', 'conditioner'],
  PHOTOS: [
    'http://o0.github.io/assets/images/tokyo/hotel1.jpg',
    'http://o0.github.io/assets/images/tokyo/hotel2.jpg',
    'http://o0.github.io/assets/images/tokyo/hotel3.jpg'
  ],
  Y_MIN: 130,
  Y_MAX: 630,
  FEATURE_CLASS: 'popup__feature'
};

var typesOffer = {
  'palace': {
    DESIGNATION: 'Дворец',
    MIN_PRICE: 10000
  },
  'flat': {
    DESIGNATION: 'Квартира',
    MIN_PRICE: 1000
  },
  'house': {
    DESIGNATION: 'Дом',
    MIN_PRICE: 5000
  },
  'bungalo': {
    DESIGNATION: 'Бунгало',
    MIN_PRICE: 0
  }
};

var capacityParams = {
  ROOMS_MIN: 1,
  ROOMS_MAX: 5,
  GUESTS_MIN: 1
};
capacityParams.GUESTS_MAX = capacityParams.ROOMS_MAX * 3;

var photoParams = {
  IMAGE_WIDTH: 45,
  IMAGE_HEIGHT: 40,
  ALT_TEXT: 'Фотография жилья',
  CLASS_NAME: 'popup__photo'
};

var countParams = {
  '1': ['1'],
  '2': ['1', '2'],
  '3': ['1', '2', '3'],
  '100': ['0']
};

var map = document.querySelector('.map');
var mapPinsElement = document.querySelector('.map__pins');
var mapPinElement = document.querySelector('.map__pin');
var mapFilters = document.querySelector('.map__filters-container');
var mainPin = document.querySelector('.map__pin--main');

var pinTemplateElement = document.querySelector('#pin')
  .content
  .querySelector('.map__pin');
var cardTemplateElement = document.querySelector('#card')
  .content
  .querySelector('.map__card');

var adForm = document.querySelector('.ad-form');
var adFieldsets = adForm.querySelectorAll('.ad-form-header, .ad-form__element');
var adAddress = adForm.querySelector('[name=address]');
var adType = adForm.querySelector('[name=type]');
var adPrice = adForm.querySelector('[name=price]');
var adTimeIn = adForm.querySelector('[name=timein]');
var adTimeOut = adForm.querySelector('[name=timeout]');
var adRooms = adForm.querySelector('[name=rooms]');
var adCapacity = adForm.querySelector('[name=capacity]');

var mapFiltersForm = document.querySelector('.map__filters');
var mapFiltersFields = mapFiltersForm.querySelectorAll('.map__filter, .map__features');

var popup;
var popupClose;

var activePin;
var pinCoordLimits = {
  xMin: 0,
  xMax: mapPinsElement.offsetWidth - mapPinElement.offsetWidth,
  yMin: cardParams.Y_MIN,
  yMax: cardParams.Y_MAX
};

// функция получения рандомного значения между min и max
var getRandomValue = function (min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
};

// функция случайной сортировки
var shuffleArray = function (arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var random = getRandomValue(0, i);
    var temp = arr[i];
    arr[i] = arr[random];
    arr[random] = temp;
  }
  return arr;
};

// функция получения массива случайной длины
var getArrayRandomLength = function (arr, number) {
  var resultArr = [];
  while (resultArr.length < number) {
    var index = getRandomValue(0, arr.length);
    var temp = arr[index];
    if (resultArr.indexOf(temp) === -1) {
      resultArr.push(temp);
    }
  }
  return resultArr;
};

// функция заполнения свойства avatar
var getAvatar = function (number) {
  return (number < 10) ? 'img/avatars/user0' + number + '.png' : 'img/avatars/user' + number + '.png';
};

// функция возвращает объект card
var getCardObject = function (number, parentElement, mixArr) {
  var card = {
    avatar: getAvatar(number + 1),
    title: mixArr[number],
    x: getRandomValue(0, parentElement.offsetWidth),
    y: getRandomValue(cardParams.Y_MIN, cardParams.Y_MAX),
    price: getRandomValue(cardParams.PRICE_MIN, cardParams.PRICE_MAX),
    type: Object.keys(typesOffer)[getRandomValue(0, Object.keys(typesOffer).length)],
    rooms: getRandomValue(capacityParams.ROOMS_MIN, capacityParams.ROOMS_MAX + 1),
    guests: getRandomValue(capacityParams.GUESTS_MIN, capacityParams.GUESTS_MAX),
    checkin: cardParams.TIME[getRandomValue(0, cardParams.TIME.length)],
    checkout: cardParams.TIME[getRandomValue(0, cardParams.TIME.length)],
    features: getArrayRandomLength(cardParams.FEATURES, getRandomValue(0, cardParams.FEATURES.length)),
    description: '',
    photos: shuffleArray(cardParams.PHOTOS)
  };
  card.address = card.x + ', ' + card.y;
  return card;
};

// функция заполнения массива похожих объявлений
var getCards = function (count, parentElement) {
  var arr = [];
  var mixTitles = shuffleArray(cardParams.TITLES);
  for (var i = 0; i < count; i++) {
    arr.push(getCardObject(i, parentElement, mixTitles));
  }
  return arr;
};

// функция создания в DOMе меток и заполнения их данными
var renderPin = function (card) {
  var pinElement = pinTemplateElement.cloneNode(true);
  var widthPin = mapPinElement.offsetWidth;
  var heightPin = mapPinElement.offsetHeight;
  var imgPin = pinElement.querySelector('img');
  pinElement.style = 'left: ' + (card.x - widthPin / 2) + 'px; top: ' + (card.y - heightPin) + 'px;';
  imgPin.src = card.avatar;
  imgPin.alt = card.title;
  pinElement.addEventListener('click', onPinClick(pinElement, card));
  return pinElement;
};

// функция создания ноды элемента li
var renderFeatures = function (value) {
  var li = document.createElement('li');
  li.classList.add(cardParams.FEATURE_CLASS, cardParams.FEATURE_CLASS + '--' + value);
  return li;
};

// функция создания ноды изображения img
var renderPhoto = function (value) {
  var image = document.createElement('img');
  image.classList.add(photoParams.CLASS_NAME);
  image.src = value;
  image.width = photoParams.IMAGE_WIDTH;
  image.height = photoParams.IMAGE_HEIGHT;
  image.alt = photoParams.ALT_TEXT;
  return image;
};

// функция создания в DOMе объявления и заполнения его данными
var renderCard = function (card) {
  var cardElement = cardTemplateElement.cloneNode(true);
  var avatarElement = cardElement.querySelector('.popup__avatar');
  popupClose = cardElement.querySelector('.popup__close');
  var titleElement = cardElement.querySelector('.popup__title');
  var addressElemnt = cardElement.querySelector('.popup__text--address');
  var priceElement = cardElement.querySelector('.popup__text--price');
  var typeElement = cardElement.querySelector('.popup__type');
  var capacityElement = cardElement.querySelector('.popup__text--capacity');
  var timeElement = cardElement.querySelector('.popup__text--time');
  var featuresContainer = cardElement.querySelector('.popup__features');
  var descriptionElement = cardElement.querySelector('.popup__description');
  var photosContainer = cardElement.querySelector('.popup__photos');
  avatarElement.src = card.avatar;
  titleElement.textContent = card.title;
  addressElemnt.textContent = card.address;
  priceElement.textContent = card.price + String.fromCharCode('8381') + '/ночь';
  typeElement.textContent = typesOffer[card.type].DESIGNATION;
  capacityElement.textContent = card.rooms + ' комнаты для ' + card.guests + ' гостей';
  timeElement.textContent = 'Заезд после ' + card.checkin + ', выезд до ' + card.checkout;
  if (card.features.length) {
    for (var i = 0; i < card.features.length; i++) {
      featuresContainer.appendChild(renderFeatures(card.features[i]));
    }
  } else {
    cardElement.removeChild(featuresContainer);
  }
  descriptionElement.textContent = card.description;
  for (i = 0; i < card.photos.length; i++) {
    photosContainer.appendChild(renderPhoto(card.photos[i]));
  }
  popup = cardElement;
  popupClose.addEventListener('click', onPopupCloseClick);
  document.addEventListener('keydown', onPopupPressEsc);
  return cardElement;
};

// функция отрисовки сгенерированных меток
var renderPins = function (arr) {
  var fragment = document.createDocumentFragment();
  for (var i = 0; i < arr.length; i++) {
    fragment.appendChild(renderPin(arr[i]));
  }
  mapPinsElement.appendChild(fragment);
};

// функция отрисовки карточки похожего объявления
var renderCardElement = function (card) {
  var fragment = document.createDocumentFragment();
  fragment.appendChild(renderCard(card));
  map.insertBefore(fragment, mapFilters);
};

// функция активации полей
var activateBlock = function (arr, element, className) {
  arr.forEach(function (item) {
    item.removeAttribute('disabled');
  });
  element.classList.remove(className);
};

// функция вычисления координат для поля Адрес
var calculateLocation = function () {
  var locationX = Math.round(mainPin.offsetLeft + mainPin.offsetWidth / 2);
  var locationY = mainPin.offsetTop + mainPin.offsetHeight;
  return locationX + ', ' + locationY;
};

// функция добавляет метки похожих объявлений
var getSimilarPins = function () {
  var cards = getCards(cardParams.COUNT, mapPinsElement);
  renderPins(cards);
};

// функция-обработчик изменения поля Тип
var onTypeChange = function () {
  var minPriceSelected = typesOffer[adType.value].MIN_PRICE;
  adPrice.setAttribute('placeholder', minPriceSelected);
  adPrice.setAttribute('min', minPriceSelected);
};

// функция-обработчик изменения поля время заезда
var onTimeInChange = function () {
  adTimeOut.value = adTimeIn.value;
};

// функция-обработчик изменения поля выезда
var onTimeOutChange = function () {
  adTimeIn.value = adTimeOut.value;
};

// функция-обработчик изменений поля кол-во комнат
var onCountChange = function () {
  var rooms = adRooms.value;
  var capacity = adCapacity.value;
  var message = (countParams[rooms].indexOf(capacity) === -1) ?
    'Количество гостей соответствует количеству комнат' : '';
  adCapacity.setCustomValidity(message);
};

// функция-обработчик захвата мышью метки адреса
var onMainPinMouseDown = function (evt) {
  var startCoords = {
    x: evt.clientX,
    y: evt.clientY
  };

  // функция возвращает число в пределах заданного диапазона
  var getValueInRange = function (value, min, max) {
    if (value < min) {
      value = min;
    }
    if (value > max) {
      value = max;
    }
    return value;
  };

  // функция возвращает координаты в пределах ограничений
  var getCoordsInParent = function (coordX, coordY, limit) {
    var coords = {
      x: getValueInRange(coordX, limit.xMin, limit.xMax),
      y: getValueInRange(coordY, limit.yMin, limit.yMax)
    };
    return coords;
  };

  // функция-обработчик перемещения мышью метки адреса
  var onMainPinMouseMove = function (moveEvt) {
    var shift = {
      x: startCoords.x - moveEvt.clientX,
      y: startCoords.y - moveEvt.clientY
    };
    startCoords = {
      x: moveEvt.clientX,
      y: moveEvt.clientY
    };
    var changedCoords = getCoordsInParent(mainPin.offsetLeft - shift.x, mainPin.offsetTop - shift.y, pinCoordLimits);
    mainPin.style.top = (changedCoords.y) + 'px';
    mainPin.style.left = (changedCoords.x) + 'px';
    adAddress.value = calculateLocation();
  };

  // функция-обработчик отпускания мышью метки адреса
  var onMainPinMouseUp = function () {
    document.removeEventListener('mousemove', onMainPinMouseMove);
    document.removeEventListener('mouseup', onMainPinMouseUp);
  };

  if (map.classList.contains('map--faded')) {
    activateBlock(adFieldsets, map, 'map--faded');
    activateBlock(mapFiltersFields, adForm, 'ad-form--disabled');
    getSimilarPins();
  }
  adAddress.value = calculateLocation();
  document.addEventListener('mousemove', onMainPinMouseMove);
  document.addEventListener('mouseup', onMainPinMouseUp);
  adType.addEventListener('change', onTypeChange);
  adTimeIn.addEventListener('change', onTimeInChange);
  adTimeOut.addEventListener('change', onTimeOutChange);
  adRooms.addEventListener('change', onCountChange);
  adCapacity.addEventListener('change', onCountChange);
};

// функция удаляет popup из DOMа
var closePopup = function () {
  activePin.classList.remove('map__pin--active');
  map.removeChild(popup);
  popup = null;
  popupClose = null;
  activePin = null;
  document.removeEventListener('keydown', onPopupPressEsc);
};

// функция-обработчик клика по кнопке закрытия карточки
var onPopupCloseClick = function () {
  closePopup();
};

// функция-обработчик нажатия на Esc
var onPopupPressEsc = function (evt) {
  if (evt.keyCode === 27) {
    closePopup();
  }
};

// функция отрисовки попапа
var renderPopup = function (card, pin) {
  renderCardElement(card);
  pin.classList.add('map__pin--active');
  activePin = pin;
};

// функция-обработчик нажатия на метку похожего объявления
var onPinClick = function (pinNode, card) {
  return function () {
    if (popup) {
      closePopup();
    }
    var pinCurrent = pinNode.classList.contains('map__pin') ? pinNode : pinNode.parentElement;
    renderPopup(card, pinCurrent);
  };
};

// функция деактивации
var deactivateFields = function (arr) {
  arr.forEach(function (item) {
    item.setAttribute('disabled', '');
  });
};

// функция изначально приводит страницу в неактивное состоние
var setInactiveState = function () {
  deactivateFields(adFieldsets);
  deactivateFields(mapFiltersFields);
  adAddress.setAttribute('value', calculateLocation());
};

setInactiveState();

// обработчик отпускания мышью метки адреса
mainPin.addEventListener('mousedown', onMainPinMouseDown);
