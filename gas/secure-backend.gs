const NEWS_SHEET_ID = '1kRwY9QryCEbhCnZtINDvZvPTd45dbHsC7y4X-ArZ5bM';
const INVENTORY_SHEET_ID = '10-NCofaWu3jRm0MtaZcUy3WLLiFvU87MCPz8oxFGqYE';
const USER_SHEET_ID = '1nFDvDMW9EEW-OM41gT6kqOtZydeMwI89FXDvsBRLAbw';
const RESERVATION_SHEET_ID = '11JjbOA1EhTFoSIQ1dz1cQbz6slE7v_pmFQAeTtqFUZk';

const INVENTORY_SHEET_NAMES = ['攝影2', '收音2', '燈光2', '場務2'];
const APP_TIMEZONE = 'Asia/Taipei';
const SCRIPT_TOKEN_KEY = 'APP_API_TOKEN';
const LINE_CHANNEL_TOKEN_KEY = 'LINE_CHANNEL_TOKEN';
const LINE_ADMIN_USER_ID_KEY = 'LINE_ADMIN_USER_ID';
const BACKEND_VERSION = 'secure-backend-2026-05-08-01';
const BACKEND_RELEASED_AT = '2026-05-08 03:25 Asia/Taipei';

const ITEM_ID_HEADER = '系統ID';
const USER_ID_HEADER = '使用者ID';
const RESERVATION_COLUMNS = {
  USER_NAME: 0,
  TIME_PERIOD: 1,
  ITEMS_TEXT: 2,
  STATUS: 3,
  RES_ID: 4,
  USER_ID: 5,
};

const RESERVATION_HEADERS = [
  '姓名',
  '借用時段',
  '借用器材',
  '預約狀態',
  '預約單ID',
  '使用者ID',
];

const RESERVATION_STATUS = {
  PENDING: '審核中',
  BORROWED: '已借出',
  RETURNED: '已歸還',
  REJECTED: '已退回',
  OVERDUE: '已逾期',
};

function doGet(e) {
  if (!e || !e.parameter) {
    return jsonResponse_({
      success: false,
      error: '請勿在編輯器內直接執行 doGet，請透過前端網頁 (Web App URL) 呼叫。',
    });
  }

  try {
    assertAuthorized_(e.parameter);

    const action = (e.parameter.action || '').trim();
    if (action === 'getInventory') {
      return jsonResponse_(getInventoryFromSheet_());
    }
    if (action === 'getMeta') {
      return jsonResponse_({ success: true, data: getBackendMeta_() });
    }

    return jsonResponse_({ success: false, error: 'Invalid Action' });
  } catch (error) {
    return handleError_(error);
  }
}

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return jsonResponse_({
      success: false,
      error: '請勿在編輯器內直接執行 doPost，請透過前端網頁傳送 POST 請求。',
    });
  }

  try {
    const params = JSON.parse(e.postData.contents);
    assertAuthorized_(params);

    const action = (params.action || '').trim();

    if (action === 'addReservation') {
      const result = addReservationToSheet_(params.reservation);
      return jsonResponse_({ success: true, reservationId: result.reservationId });
    }

    if (action === 'updateStatus') {
      updateReservationStatusInSheet_(params.resId, params.status);
      return jsonResponse_({ success: true });
    }

    if (action === 'addUser') {
      const createdUser = addUserToSheet_(params.user);
      return jsonResponse_({ success: true, data: { user: createdUser } });
    }

    if (action === 'updateUser') {
      const updatedUser = updateUserInSheet_(params.user);
      return jsonResponse_({ success: true, data: { user: updatedUser } });
    }

    if (action === 'addItem') {
      const result = addItemToSheet_(params.item);
      return jsonResponse_({ success: true, data: result });
    }

    if (action === 'addNews') {
      addNewsToSheet_(params.news);
      return jsonResponse_({ success: true });
    }

    if (action === 'updateNews') {
      updateNewsInSheet_(params.news);
      return jsonResponse_({ success: true });
    }

    if (action === 'deleteNews') {
      deleteNewsFromSheet_(params.newsId);
      return jsonResponse_({ success: true });
    }

    return jsonResponse_({ success: false, error: 'Unknown Action' });
  } catch (error) {
    return handleError_(error);
  }
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleError_(error) {
  return jsonResponse_({
    success: false,
    error: error && error.message ? error.message : String(error),
  });
}

function assertAuthorized_(params) {
  const providedToken = params && params.token ? String(params.token).trim() : '';
  const expectedToken = getRequiredScriptProperty_(SCRIPT_TOKEN_KEY);

  if (!providedToken || providedToken !== expectedToken) {
    throw new Error('Unauthorized request');
  }
}

function getRequiredScriptProperty_(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) {
    throw new Error('Missing script property: ' + key);
  }
  return value;
}

function getInventoryFromSheet_() {
  const inventorySs = SpreadsheetApp.openById(INVENTORY_SHEET_ID);
  const userSs = SpreadsheetApp.openById(USER_SHEET_ID);
  const resSs = SpreadsheetApp.openById(RESERVATION_SHEET_ID);
  const newsSs = SpreadsheetApp.openById(NEWS_SHEET_ID);

  const inventoryData = buildInventoryPayload_(inventorySs);
  const users = getUsersFromSheet_(userSs);
  const reservations = getReservationsFromSheet_(resSs, users, inventoryData.items);
  const news = getNewsFromSheet_(newsSs);

  return {
    meta: getBackendMeta_(),
    types: inventoryData.types,
    items: inventoryData.items,
    users: users,
    reservations: reservations,
    news: news,
  };
}

function getBackendMeta_() {
  return {
    version: BACKEND_VERSION,
    releasedAt: BACKEND_RELEASED_AT,
    timezone: APP_TIMEZONE,
    reservationSchema: 'v6',
    supportedGetActions: ['getInventory', 'getMeta'],
    supportedPostActions: [
      'addReservation',
      'updateStatus',
      'addUser',
      'updateUser',
      'addItem',
      'addNews',
      'updateNews',
      'deleteNews',
    ],
  };
}

function buildInventoryPayload_(inventorySs) {
  const items = [];
  const typesSet = new Set();

  INVENTORY_SHEET_NAMES.forEach(function (sheetName) {
    const sheet = inventorySs.getSheetByName(sheetName);
    if (!sheet) return;

    const idCol = ensureHeaderColumn_(sheet, ITEM_ID_HEADER);
    const data = sheet.getDataRange().getDisplayValues();
    if (data.length < 2) return;

    const headers = data[0].map(function (header) {
      return String(header).trim().toLowerCase();
    });

    const typeCol = findColIndex_(headers, ['母項目', '類別', '分類'], ['母', '類', 'type']);
    const nameCol = findColIndex_(headers, ['項目', '名稱', '器材'], ['項', '名'], ['母項目', '母']);
    const qtyCol = findColIndex_(headers, ['數量', '總數', 'qty'], ['數']);
    const accCol = findColIndex_(headers, ['內容', '配件', '備註'], ['內容', '配', '備註']);
    const statusCol = findColIndex_(headers, ['狀態', '現況', 'status'], ['狀', '況']);
    const finalNameCol = nameCol !== -1 ? nameCol : 1;

    for (let i = 1; i < data.length; i += 1) {
      const row = data[i];
      const itemName = String(row[finalNameCol] || '').trim();
      if (!itemName) continue;

      const rowNumber = i + 1;
      let stableId = String(row[idCol - 1] || '').trim();
      if (!stableId) {
        stableId = generateStableId_('IT');
        sheet.getRange(rowNumber, idCol).setValue(stableId);
      }

      const itemType = inferItemType_(sheetName, typeCol !== -1 ? row[typeCol] : '');
      typesSet.add(itemType);

      let qty = 1;
      if (qtyCol !== -1 && row[qtyCol]) {
        qty = parseInt(row[qtyCol], 10);
        if (isNaN(qty) || qty < 1) qty = 1;
      }

      const accessories = accCol !== -1 ? row[accCol] : '';
      const statusRaw = statusCol !== -1 ? row[statusCol] : '';
      if (String(statusRaw || '').indexOf('不外借') !== -1) continue;

      items.push({
        id: stableId,
        name: itemName,
        type: itemType,
        accessories: accessories,
        status: mapInventoryStatus_(statusRaw),
        qty: qty,
      });
    }
  });

  return {
    types: Array.from(typesSet),
    items: items,
  };
}

function getUsersFromSheet_(userSs) {
  const userSheet = userSs.getSheets()[0];
  const userIdCol = ensureHeaderColumn_(userSheet, USER_ID_HEADER);
  const userData = userSheet.getDataRange().getDisplayValues();
  const users = [];

  for (let i = 1; i < userData.length; i += 1) {
    const row = userData[i];
    if (!row[0]) continue;

    const rowNumber = i + 1;
    const name = String(row[0] || '').trim();
    const phoneLast5 = String(row[1] || '').trim();
    const statusStr = String(row[2] || '').trim();
    let userId = String(row[userIdCol - 1] || '').trim();

    if (!userId) {
      userId = generateStableId_('USR');
      userSheet.getRange(rowNumber, userIdCol).setValue(userId);
    }

    users.push({
      id: userId,
      name: name,
      phoneLast5: phoneLast5,
      role: statusStr.indexOf('管理員') !== -1 ? 'admin' : 'user',
      status: 'active',
      department: '',
    });
  }

  return users;
}

function getReservationsFromSheet_(resSs, users, items) {
  const resSheet = resSs.getSheets()[0];
  ensureCompactReservationHeaders_(resSheet);
  const resData = resSheet.getDataRange().getDisplayValues();
  const reservations = [];

  let startIndex = 0;
  if (resData.length > 0 && String(resData[0][0] || '').indexOf('姓名') !== -1) {
    startIndex = 1;
  }

  for (let i = startIndex; i < resData.length; i += 1) {
    const row = resData[i];
    if (!row[RESERVATION_COLUMNS.USER_NAME]) continue;

    const reservation = parseReservationRow_(row, users, items, i);
    if (reservation) reservations.push(reservation);
  }

  return reservations;
}

function parseReservationRow_(row, users, items, rowIndex) {
  const userName = String(row[RESERVATION_COLUMNS.USER_NAME] || '').trim();
  const status = String(row[RESERVATION_COLUMNS.STATUS] || RESERVATION_STATUS.PENDING).trim();
  const resId = String(row[RESERVATION_COLUMNS.RES_ID] || ('R_fetch_' + rowIndex)).trim();
  const explicitUserId = String(row[RESERVATION_COLUMNS.USER_ID] || '').trim();
  const submitDate = extractSubmitDateFromReservationId_(resId);
  const period = parseTimePeriod_(String(row[RESERVATION_COLUMNS.TIME_PERIOD] || '').trim());
  const itemsPayload = parseReservationItems_(
    String(row[RESERVATION_COLUMNS.ITEMS_TEXT] || '').trim(),
    items,
    period
  );

  const matchedUser = users.find(function (user) {
    return user.id === explicitUserId || user.name === userName;
  });

  return {
    id: resId,
    userId: explicitUserId || (matchedUser ? matchedUser.id : ('unknown_' + rowIndex)),
    userName: userName,
    items: itemsPayload,
    status: status,
    submitDate: submitDate,
  };
}

function getNewsFromSheet_(newsSs) {
  const newsSheet = initNewsSheet_(newsSs);
  const newsData = newsSheet.getDataRange().getDisplayValues();
  const newsList = [];

  for (let i = 1; i < newsData.length; i += 1) {
    if (!newsData[i][0]) continue;

    newsList.push({
      id: newsData[i][0],
      date: newsData[i][1],
      title: newsData[i][2],
      content: newsData[i][3],
      imageUrl: newsData[i][4] || '',
      linkUrl: newsData[i][5] || '',
      linkText: newsData[i][6] || '',
    });
  }

  return newsList;
}

function initNewsSheet_(ss) {
  let sheet = ss.getSheetByName('最新消息');
  if (!sheet) {
    sheet = ss.getSheets()[0];
    if (sheet.getLastRow() === 0 || sheet.getName() === '工作表1') {
      sheet.setName('最新消息');
      sheet.appendRow(['ID', '日期', '標題', '內文', '圖片', '連結', '連結名稱']);
    } else {
      sheet = ss.insertSheet('最新消息');
      sheet.appendRow(['ID', '日期', '標題', '內文', '圖片', '連結', '連結名稱']);
    }
  }
  return sheet;
}

function addReservationToSheet_(reservation) {
  validateReservationPayload_(reservation);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const ss = SpreadsheetApp.openById(RESERVATION_SHEET_ID);
    const sheet = ss.getSheets()[0];
    ensureCompactReservationHeaders_(sheet);

    const currentData = getInventoryFromSheet_();
    assertReservationDoesNotConflict_(reservation, currentData);

    const userName = String(reservation.userName).trim();
    const userId = String(reservation.userId || '').trim();
    const firstItem = reservation.items[0];
    const timePeriod = formatTimePeriod_(firstItem);
    const itemsString = reservation.items.map(function (item) {
      return item.name + '（' + (parseInt(item.borrowQty, 10) || 1) + '）';
    }).join('、');

    sheet.appendRow([
      userName,
      timePeriod,
      itemsString,
      reservation.status || RESERVATION_STATUS.PENDING,
      reservation.id,
      userId,
    ]);

    sendLineNotification_(userName, timePeriod, itemsString);
    return { reservationId: reservation.id };
  } finally {
    lock.releaseLock();
  }
}

function validateReservationPayload_(reservation) {
  if (!reservation || !reservation.id || !reservation.userName || !reservation.userId) {
    throw new Error('Invalid reservation payload');
  }

  if (!Array.isArray(reservation.items) || reservation.items.length === 0) {
    throw new Error('Reservation must contain at least one item');
  }

  reservation.items.forEach(function (item) {
    if (!item || !item.name || !item.itemId) {
      throw new Error('Reservation item is missing id or name');
    }

    const qty = parseInt(item.borrowQty, 10);
    if (isNaN(qty) || qty < 1) {
      throw new Error('Invalid borrow quantity for item: ' + item.name);
    }

    const startDt = parseDateTime_(item.startDate, item.startTime || '00:00');
    const endDt = parseDateTime_(item.endDate, item.endTime || '23:59');
    if (startDt.getTime() >= endDt.getTime()) {
      throw new Error('Invalid borrow period for item: ' + item.name);
    }
  });
}

function assertReservationDoesNotConflict_(reservation, currentData) {
  const borrowedReservations = currentData.reservations.filter(function (res) {
    return res.status === RESERVATION_STATUS.BORROWED || res.status === RESERVATION_STATUS.OVERDUE;
  });

  reservation.items.forEach(function (reqItem) {
    const catalogItem = currentData.items.find(function (item) {
      return item.id === reqItem.itemId || item.name === reqItem.name;
    });

    const totalQty = catalogItem && catalogItem.qty ? catalogItem.qty : 1;
    let overlappingQty = 0;

    borrowedReservations.forEach(function (borrowedReservation) {
      (borrowedReservation.items || []).forEach(function (borrowedItem) {
        const isSameItem =
          borrowedItem.itemId === reqItem.itemId ||
          (borrowedItem.name && borrowedItem.name === reqItem.name);
        if (!isSameItem) return;

        if (isDateOverlap_(
          reqItem.startDate,
          reqItem.startTime,
          reqItem.endDate,
          reqItem.endTime,
          borrowedItem.startDate,
          borrowedItem.startTime,
          borrowedItem.endDate,
          borrowedItem.endTime
        )) {
          overlappingQty += parseInt(borrowedItem.borrowQty, 10) || 1;
        }
      });
    });

    const requestedQty = parseInt(reqItem.borrowQty, 10) || 1;
    if (overlappingQty + requestedQty > totalQty) {
      throw new Error(
        '庫存不足: ' + reqItem.name +
        '，衝突時段已借出 ' + overlappingQty +
        ' 件，申請 ' + requestedQty +
        ' 件，總庫存 ' + totalQty + ' 件'
      );
    }
  });
}

function updateReservationStatusInSheet_(resId, newStatus) {
  if (!resId || !newStatus) {
    throw new Error('Missing reservation id or status');
  }

  const allowedStatuses = [
    RESERVATION_STATUS.PENDING,
    RESERVATION_STATUS.BORROWED,
    RESERVATION_STATUS.RETURNED,
    RESERVATION_STATUS.REJECTED,
    RESERVATION_STATUS.OVERDUE,
  ];

  if (allowedStatuses.indexOf(newStatus) === -1) {
    throw new Error('Invalid reservation status');
  }

  const ss = SpreadsheetApp.openById(RESERVATION_SHEET_ID);
  const sheet = ss.getSheets()[0];
  const data = sheet.getDataRange().getValues();

  for (let i = 0; i < data.length; i += 1) {
    if (String(data[i][RESERVATION_COLUMNS.RES_ID] || '').trim() === resId) {
      sheet.getRange(i + 1, RESERVATION_COLUMNS.STATUS + 1).setValue(newStatus);
      return;
    }
  }

  throw new Error('Reservation not found: ' + resId);
}

function addUserToSheet_(userObj) {
  if (!userObj || !userObj.name || !String(userObj.phoneLast5 || '').trim()) {
    throw new Error('Invalid user payload');
  }

  const phoneLast5 = String(userObj.phoneLast5).trim();
  if (!/^\d{5}$/.test(phoneLast5)) {
    throw new Error('phoneLast5 must be exactly 5 digits');
  }

  const ss = SpreadsheetApp.openById(USER_SHEET_ID);
  const sheet = ss.getSheets()[0];
  const userIdCol = ensureHeaderColumn_(sheet, USER_ID_HEADER);
  const data = sheet.getDataRange().getDisplayValues();

  for (let i = 1; i < data.length; i += 1) {
    if (String(data[i][1] || '').trim() === phoneLast5) {
      throw new Error('User already exists');
    }
  }

  const statusStr = '一般會員';
  const newUserId = generateStableId_('USR');
  const rowLength = Math.max(sheet.getLastColumn(), userIdCol);
  const newRow = new Array(rowLength).fill('');
  newRow[0] = String(userObj.name).trim();
  newRow[1] = phoneLast5;
  newRow[2] = statusStr;
  newRow[userIdCol - 1] = newUserId;

  let insertRowIndex = -1;
  for (let i = data.length - 1; i >= 1; i -= 1) {
    if (data[i][2] && String(data[i][2]).trim() === statusStr) {
      insertRowIndex = i + 1;
      break;
    }
  }

  if (insertRowIndex !== -1) {
    sheet.insertRowAfter(insertRowIndex);
    sheet.getRange(insertRowIndex + 1, 1, 1, newRow.length).setValues([newRow]);
  } else {
    sheet.appendRow(newRow);
  }

  return {
    id: newUserId,
    name: String(userObj.name).trim(),
    phoneLast5: phoneLast5,
    role: 'user',
    status: 'active',
    department: '',
  };
}

function updateUserInSheet_(userObj) {
  if (!userObj || !String(userObj.id || '').trim()) {
    throw new Error('Missing user id');
  }

  const name = String(userObj.name || '').trim();
  const phoneLast5 = String(userObj.phoneLast5 || '').trim();
  const role = String(userObj.role || 'user').trim();

  if (!name) {
    throw new Error('User name is required');
  }

  if (!/^\d{5}$/.test(phoneLast5)) {
    throw new Error('phoneLast5 must be exactly 5 digits');
  }

  if (role !== 'user' && role !== 'admin') {
    throw new Error('Invalid user role');
  }

  const ss = SpreadsheetApp.openById(USER_SHEET_ID);
  const sheet = ss.getSheets()[0];
  const userIdCol = ensureHeaderColumn_(sheet, USER_ID_HEADER);
  const data = sheet.getDataRange().getDisplayValues();
  const targetUserId = String(userObj.id).trim();
  const statusStr = mapUserRoleToStatus_(role);
  let targetRowNumber = -1;

  for (let i = 1; i < data.length; i += 1) {
    const rowUserId = String(data[i][userIdCol - 1] || '').trim();
    const rowPhoneLast5 = String(data[i][1] || '').trim();

    if (rowUserId && rowUserId === targetUserId) {
      targetRowNumber = i + 1;
      continue;
    }

    if (rowPhoneLast5 === phoneLast5) {
      throw new Error('User already exists');
    }
  }

  if (targetRowNumber === -1) {
    throw new Error('User not found');
  }

  sheet.getRange(targetRowNumber, 1).setValue(name);
  sheet.getRange(targetRowNumber, 2).setValue(phoneLast5);
  sheet.getRange(targetRowNumber, 3).setValue(statusStr);
  sheet.getRange(targetRowNumber, userIdCol).setValue(targetUserId);

  return {
    id: targetUserId,
    name: name,
    phoneLast5: phoneLast5,
    role: role,
    status: 'active',
    department: '',
  };
}

function addItemToSheet_(itemObj) {
  if (!itemObj || !itemObj.name) {
    throw new Error('Invalid item payload');
  }

  const qty = parseInt(itemObj.qty, 10);
  if (isNaN(qty) || qty < 1) {
    throw new Error('Item qty must be a positive integer');
  }

  const ss = SpreadsheetApp.openById(INVENTORY_SHEET_ID);
  let sheetName = '場務2';
  if (['相機', '鏡頭', '穩定器', '螢幕', '電池', '攝影器材'].indexOf(itemObj.type) !== -1) sheetName = '攝影2';
  else if (['收音設備', '機頭Mic', '無線Mic'].indexOf(itemObj.type) !== -1) sheetName = '收音2';
  else if (['燈具', '燈腳', '燈具配件'].indexOf(itemObj.type) !== -1) sheetName = '燈光2';

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Inventory sheet not found: ' + sheetName);

  const idCol = ensureHeaderColumn_(sheet, ITEM_ID_HEADER);
  const data = sheet.getDataRange().getDisplayValues();
  const headers = data[0].map(function (header) {
    return String(header).trim().toLowerCase();
  });

  const typeCol = headers.findIndex(function (header) {
    return header.indexOf('母') !== -1 || header.indexOf('類') !== -1 || header.indexOf('type') !== -1;
  });
  const nameCol = headers.findIndex(function (header) {
    return (header.indexOf('項') !== -1 || header.indexOf('名') !== -1) && header.indexOf('母') === -1;
  });
  const qtyCol = headers.findIndex(function (header) {
    return header.indexOf('數') !== -1 || header.indexOf('qty') !== -1;
  });
  const accCol = headers.findIndex(function (header) {
    return header.indexOf('內容') !== -1 || header.indexOf('配') !== -1 || header.indexOf('備註') !== -1;
  });
  const statusCol = headers.findIndex(function (header) {
    return header.indexOf('狀') !== -1 || header.indexOf('況') !== -1;
  });

  const rowLength = Math.max(sheet.getLastColumn(), idCol);
  const newRow = new Array(rowLength).fill('');
  const createdItemId = generateStableId_('IT');
  if (typeCol !== -1) newRow[typeCol] = itemObj.type;

  const finalNameCol = nameCol !== -1 ? nameCol : (sheetName === '場務2' ? 0 : 1);
  newRow[finalNameCol] = String(itemObj.name).trim();
  if (qtyCol !== -1) newRow[qtyCol] = qty;
  if (accCol !== -1) newRow[accCol] = itemObj.accessories || '';
  if (statusCol !== -1) newRow[statusCol] = '在架上';
  newRow[idCol - 1] = createdItemId;

  let insertRowIndex = -1;
  if (typeCol !== -1) {
    for (let i = data.length - 1; i >= 1; i -= 1) {
      if (data[i][typeCol] && String(data[i][typeCol]).trim() === itemObj.type) {
        insertRowIndex = i + 1;
        break;
      }
    }
  }

  if (insertRowIndex !== -1) {
    sheet.insertRowAfter(insertRowIndex);
    sheet.getRange(insertRowIndex + 1, 1, 1, newRow.length).setValues([newRow]);
  } else {
    sheet.appendRow(newRow);
  }

  const newsSs = SpreadsheetApp.openById(NEWS_SHEET_ID);
  const newsSheet = initNewsSheet_(newsSs);
  const now = new Date();
  const dateStr = Utilities.formatDate(now, APP_TIMEZONE, 'yyyy-MM-dd HH:mm');
  const createdNews = {
    id: 'NW_' + now.getTime(),
    date: dateStr,
    title: '✨ 新器材上架：' + itemObj.name,
    content: '',
    imageUrl: '',
    linkUrl: '',
    linkText: '',
  };

  newsSheet.appendRow([
    createdNews.id,
    createdNews.date,
    createdNews.title,
    createdNews.content,
    createdNews.imageUrl,
    createdNews.linkUrl,
    createdNews.linkText,
  ]);

  return {
    item: {
      id: createdItemId,
      name: String(itemObj.name).trim(),
      type: itemObj.type,
      accessories: itemObj.accessories || '',
      status: 'available',
      qty: qty,
    },
    news: createdNews,
  };
}

function addNewsToSheet_(newsObj) {
  if (!newsObj || !String(newsObj.title || '').trim()) {
    throw new Error('Invalid news payload');
  }

  const ss = SpreadsheetApp.openById(NEWS_SHEET_ID);
  const sheet = initNewsSheet_(ss);

  sheet.appendRow([
    newsObj.id,
    newsObj.date,
    newsObj.title,
    newsObj.content || '',
    newsObj.imageUrl || '',
    newsObj.linkUrl || '',
    newsObj.linkText || '',
  ]);
}

function updateNewsInSheet_(newsObj) {
  if (!newsObj || !newsObj.id) {
    throw new Error('Invalid news payload');
  }

  const ss = SpreadsheetApp.openById(NEWS_SHEET_ID);
  const sheet = initNewsSheet_(ss);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i += 1) {
    if (data[i][0] === newsObj.id) {
      sheet.getRange(i + 1, 2, 1, 6).setValues([[
        newsObj.date,
        newsObj.title,
        newsObj.content || '',
        newsObj.imageUrl || '',
        newsObj.linkUrl || '',
        newsObj.linkText || '',
      ]]);
      return;
    }
  }

  throw new Error('News not found: ' + newsObj.id);
}

function deleteNewsFromSheet_(newsId) {
  if (!newsId) {
    throw new Error('Missing news id');
  }

  const ss = SpreadsheetApp.openById(NEWS_SHEET_ID);
  const sheet = initNewsSheet_(ss);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i += 1) {
    if (data[i][0] === newsId) {
      sheet.deleteRow(i + 1);
      return;
    }
  }

  throw new Error('News not found: ' + newsId);
}

function checkAndNotifyLine() {
  const data = getInventoryFromSheet_();
  const reservations = data.reservations;
  const now = new Date();
  const properties = PropertiesService.getScriptProperties();

  reservations.forEach(function (res) {
    if (res.status !== RESERVATION_STATUS.BORROWED) return;

    (res.items || []).forEach(function (item) {
      const startDt = parseDateTime_(item.startDate, item.startTime || '00:00');
      const endDt = parseDateTime_(item.endDate, item.endTime || '23:59');

      const diffMinsStart = (startDt.getTime() - now.getTime()) / (1000 * 60);
      if (diffMinsStart > 0 && diffMinsStart <= 60) {
        const pickupKey = 'notified_pickup_' + res.id + '_' + (item.itemId || item.name);
        if (!properties.getProperty(pickupKey)) {
          sendLineAlert_(
            '【取用提醒】\n會員 ' + res.userName +
            ' 預計於 1 小時內 (' + (item.startTime || '00:00') + ') 前往取用器材：' + item.name
          );
          properties.setProperty(pickupKey, 'true');
        }
      }

      if (now.getTime() > endDt.getTime()) {
        const overdueKey = 'notified_overdue_' + res.id + '_' + (item.itemId || item.name);
        if (!properties.getProperty(overdueKey)) {
          sendLineAlert_(
            '【逾期警報】\n會員 ' + res.userName +
            ' 器材已逾期未還！\n單號：' + res.id +
            '\n器材：' + item.name +
            '\n應還時間：' + item.endDate + ' ' + item.endTime
          );
          properties.setProperty(overdueKey, 'true');
        }
      }
    });
  });
}

function sendLineNotification_(userName, timePeriod, itemsString) {
  const messageText =
    '【新的預約單申請】\n\n' +
    '申請人：' + userName + '\n' +
    '借用時段：' + timePeriod + '\n\n' +
    '借用器材：\n' + itemsString + '\n\n' +
    '請管理員至系統進行審核。';

  pushLineMessage_(messageText);
}

function sendLineAlert_(messageText) {
  pushLineMessage_(messageText);
}

function pushLineMessage_(messageText) {
  const channelToken = PropertiesService.getScriptProperties().getProperty(LINE_CHANNEL_TOKEN_KEY);
  const adminUserId = PropertiesService.getScriptProperties().getProperty(LINE_ADMIN_USER_ID_KEY);
  if (!channelToken || !adminUserId) return;

  const url = 'https://api.line.me/v2/bot/message/push';
  const payload = {
    to: adminUserId,
    messages: [{ type: 'text', text: messageText }],
  };
  const options = {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + channelToken,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    UrlFetchApp.fetch(url, options);
  } catch (error) {
    console.error('LINE 發送失敗:', error);
  }
}

function ensureHeaderColumn_(sheet, headerName) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getDisplayValues()[0];
  const normalizedTarget = String(headerName).trim();

  for (let i = 0; i < headers.length; i += 1) {
    if (String(headers[i] || '').trim() === normalizedTarget) {
      return i + 1;
    }
  }

  const newCol = headers.length + 1;
  sheet.getRange(1, newCol).setValue(headerName);
  return newCol;
}

function ensureCompactReservationHeaders_(sheet) {
  if (sheet.getLastRow() === 0) return;
  const firstCell = String(sheet.getRange(1, 1).getDisplayValue() || '').trim();
  if (firstCell.indexOf('姓名') === -1) return;

  RESERVATION_HEADERS.forEach(function (headerName, index) {
    const current = String(sheet.getRange(1, index + 1).getDisplayValue() || '').trim();
    if (current !== headerName) {
      sheet.getRange(1, index + 1).setValue(headerName);
    }
  });
}

function generateStableId_(prefix) {
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
}

function mapUserRoleToStatus_(role) {
  return role === 'admin' ? '管理員' : '一般會員';
}

function findColIndex_(headers, exactMatches, partialMatches, excludeMatches) {
  const excludes = excludeMatches || [];
  const exactIdx = headers.findIndex(function (header) {
    return exactMatches.indexOf(header) !== -1;
  });
  if (exactIdx !== -1) return exactIdx;

  for (let i = 0; i < headers.length; i += 1) {
    const header = headers[i];
    const matchesPartial = partialMatches.some(function (keyword) {
      return header.indexOf(keyword) !== -1;
    });
    const matchesExcluded = excludes.some(function (keyword) {
      return header.indexOf(keyword) !== -1;
    });
    if (matchesPartial && !matchesExcluded) return i;
  }

  return -1;
}

function inferItemType_(sheetName, typeValue) {
  if (typeValue) return typeValue;
  if (sheetName === '場務2') return '場務器材';
  if (sheetName === '燈光2') return '燈具';
  if (sheetName === '收音2') return '收音設備';
  if (sheetName === '攝影2') return '攝影器材';
  return '其他';
}

function mapInventoryStatus_(statusRaw) {
  const raw = String(statusRaw || '');
  if (raw.indexOf('請洽詢') !== -1) return 'inquire';
  if (raw.indexOf('借') !== -1) return 'borrowed';
  if (raw.indexOf('壞') !== -1 || raw.indexOf('修') !== -1 || raw.indexOf('缺') !== -1) return 'maintenance';
  return 'available';
}

function parseTimePeriod_(timePeriod) {
  const emptyPeriod = { startDate: '', startTime: '', endDate: '', endTime: '' };
  if (!timePeriod || timePeriod.indexOf('~') === -1) return emptyPeriod;

  const parts = timePeriod.split('~').map(function (part) {
    return String(part).trim();
  });
  const startParts = parts[0].split(/\s+/);
  const endParts = parts[1].split(/\s+/);

  return {
    startDate: startParts[0] || '',
    startTime: startParts[1] || '00:00',
    endDate: endParts[0] || '',
    endTime: endParts[1] || '23:59',
  };
}

function parseReservationItems_(itemsString, items, period) {
  if (!itemsString) return [];

  return itemsString.split('、').map(function (rawItem) {
    const str = String(rawItem || '').trim();
    const match = str.match(/(.+?)（(\d+)）/);
    let itemName = str;
    let qty = 1;

    if (match) {
      itemName = match[1].trim();
      qty = parseInt(match[2], 10) || 1;
    }

    const foundItem = items.find(function (item) {
      return item.name === itemName;
    });

    return {
      itemId: foundItem ? foundItem.id : '',
      name: itemName,
      borrowQty: qty,
      startDate: period.startDate,
      startTime: period.startTime || '00:00',
      endDate: period.endDate,
      endTime: period.endTime || '23:59',
    };
  });
}

function formatTimePeriod_(item) {
  return item.startDate + ' ' + (item.startTime || '00:00') + ' ~ ' + item.endDate + ' ' + (item.endTime || '23:59');
}

function parseDateTime_(dateStr, timeStr) {
  if (!dateStr) {
    throw new Error('Missing date value');
  }
  return new Date(dateStr + 'T' + (timeStr || '00:00') + ':00+08:00');
}

function isDateOverlap_(startD1, startT1, endD1, endT1, startD2, startT2, endD2, endT2) {
  const dtStart1 = parseDateTime_(startD1, startT1 || '00:00').getTime();
  const dtEnd1 = parseDateTime_(endD1, endT1 || '23:59').getTime();
  const dtStart2 = parseDateTime_(startD2, startT2 || '00:00').getTime();
  const dtEnd2 = parseDateTime_(endD2, endT2 || '23:59').getTime();
  return dtStart1 < dtEnd2 && dtEnd1 > dtStart2;
}

function extractSubmitDateFromReservationId_(resId) {
  const match = String(resId || '').match(/^ch(\d{4})(\d{2})(\d{2})\d+/);
  if (match) {
    return match[1] + '-' + match[2] + '-' + match[3];
  }

  return Utilities.formatDate(new Date(), APP_TIMEZONE, 'yyyy-MM-dd');
}

function compactReservationSheetToSixColumns() {
  const ss = SpreadsheetApp.openById(RESERVATION_SHEET_ID);
  const sheet = ss.getSheets()[0];
  const data = sheet.getDataRange().getDisplayValues();
  if (data.length === 0) return;

  const compactRows = [RESERVATION_HEADERS];
  const startIndex = String(data[0][0] || '').indexOf('姓名') !== -1 ? 1 : 0;

  for (let i = startIndex; i < data.length; i += 1) {
    const row = data[i];
    if (!String(row[RESERVATION_COLUMNS.USER_NAME] || '').trim()) continue;

    compactRows.push([
      String(row[RESERVATION_COLUMNS.USER_NAME] || '').trim(),
      String(row[RESERVATION_COLUMNS.TIME_PERIOD] || '').trim(),
      String(row[RESERVATION_COLUMNS.ITEMS_TEXT] || '').trim(),
      String(row[RESERVATION_COLUMNS.STATUS] || RESERVATION_STATUS.PENDING).trim(),
      String(row[RESERVATION_COLUMNS.RES_ID] || '').trim(),
      String(row[RESERVATION_COLUMNS.USER_ID] || '').trim(),
    ]);
  }

  const existingLastRow = Math.max(sheet.getLastRow(), compactRows.length);
  const existingLastCol = Math.max(sheet.getLastColumn(), RESERVATION_HEADERS.length);

  // 只清空目前已使用範圍，避免把工作表其他空白欄列結構也刪掉。
  sheet.getRange(1, 1, existingLastRow, existingLastCol).clearContent();
  sheet.getRange(1, 1, compactRows.length, RESERVATION_HEADERS.length).setValues(compactRows);
}

function compactReservationSheetToSixColumnsAndTrimSheet() {
  compactReservationSheetToSixColumns();

  const ss = SpreadsheetApp.openById(RESERVATION_SHEET_ID);
  const sheet = ss.getSheets()[0];
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastCol > RESERVATION_HEADERS.length) {
    sheet.deleteColumns(RESERVATION_HEADERS.length + 1, lastCol - RESERVATION_HEADERS.length);
  }

  if (lastRow > 1) {
    const desiredRows = lastRow;
    const maxRows = sheet.getMaxRows();
    if (maxRows > desiredRows) {
      sheet.deleteRows(desiredRows + 1, maxRows - desiredRows);
    }
  }
}
