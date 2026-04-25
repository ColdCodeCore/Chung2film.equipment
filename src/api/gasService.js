const GAS_API_URL = "https://script.google.com/macros/s/AKfycbyVTAbSztTZn9Pn7r27JQIXC1HPN9z3U_xOEfC1I0zAm17tYcDtI9Mos7Q3w4SYE9Tg/exec";

// === API 串接與本地雙軌模式服務 ===
export const api = {
  async getInventory() {
    if (GAS_API_URL) {
      const res = await fetch(`${GAS_API_URL}?action=getInventory`);
      return await res.json();
    } else {
      const data = JSON.parse(localStorage.getItem('mockDB') || 'null');
      if (data) return data;
      const initial = {
        types: ['攝影器材', '收音設備', '配件', '其他'],
        items: [{ id: 'IT1001', name: 'MacBook Pro M2', type: '筆記型電腦', qty: 3, status: 'available' }],
        users: [
          { id: 'U_00000_0', name: '管理員測試', phoneLast5: '00000', role: 'admin', status: 'active' },
          { id: 'U_11111_1', name: '會員測試', phoneLast5: '11111', role: 'user', status: 'active' }
        ],
        reservations: [],
        news: []
      };
      localStorage.setItem('mockDB', JSON.stringify(initial));
      return initial;
    }
  },
  async addReservation(reservation) {
    if (GAS_API_URL) {
      await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addReservation', reservation })
      });
    } else {
      const db = JSON.parse(localStorage.getItem('mockDB'));
      db.reservations.push(reservation);
      localStorage.setItem('mockDB', JSON.stringify(db));
    }
  },
  async updateStatus(resId, status) {
    if (GAS_API_URL) {
      await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateStatus', resId, status })
      });
    } else {
      const db = JSON.parse(localStorage.getItem('mockDB'));
      const target = db.reservations.find(r => r.id === resId);
      if(target) target.status = status;
      localStorage.setItem('mockDB', JSON.stringify(db));
    }
  },
  async addUser(user) {
    if (GAS_API_URL) {
      await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addUser', user })
      });
    } else {
      const db = JSON.parse(localStorage.getItem('mockDB'));
      db.users.push(user);
      localStorage.setItem('mockDB', JSON.stringify(db));
    }
  },
  async addItem(item) {
    if (GAS_API_URL) {
      await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addItem', item })
      });
    } else {
      const db = JSON.parse(localStorage.getItem('mockDB'));
      db.items.push(item);
      db.news.push({
        id: `NW_${Date.now()}`,
        date: new Date().toLocaleString('zh-TW', {hour12: false}),
        title: `✨ 新器材上架：${item.name}`,
        content: ``,
        imageUrl: '',
        linkUrl: '',
        linkText: ''
      });
      localStorage.setItem('mockDB', JSON.stringify(db));
    }
  },
  async addNews(news) {
    if (GAS_API_URL) {
      await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'addNews', news })
      });
    } else {
      const db = JSON.parse(localStorage.getItem('mockDB'));
      db.news.push(news);
      localStorage.setItem('mockDB', JSON.stringify(db));
    }
  },
  async updateNews(news) {
    if (GAS_API_URL) {
      await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateNews', news })
      });
    } else {
      const db = JSON.parse(localStorage.getItem('mockDB'));
      const idx = db.news.findIndex(n => n.id === news.id);
      if (idx > -1) db.news[idx] = news;
      localStorage.setItem('mockDB', JSON.stringify(db));
    }
  },
  async deleteNews(newsId) {
    if (GAS_API_URL) {
      await fetch(GAS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteNews', newsId })
      });
    } else {
      const db = JSON.parse(localStorage.getItem('mockDB'));
      db.news = db.news.filter(n => n.id !== newsId);
      localStorage.setItem('mockDB', JSON.stringify(db));
    }
  }
};