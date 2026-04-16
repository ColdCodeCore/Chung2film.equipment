// ⭐ 將您從 Google Apps Script 部署取得的 Web App URL 貼在這裡
// 如果保持空白 ("")，系統會自動啟動「本地快取模式」，方便您在未連線資料庫時也能測試 UI
const GAS_API_URL = "https://script.google.com/macros/s/AKfycbyMEAxjXMloN5TrtufJ6DwRE1bLvnSbEpjuFbRHdbeD1ZbntoQA5TaOMqmpEzfLFLAh/exec"; 

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Package, Search, User, LogOut, CheckCircle, XCircle, Plus, 
  Menu, X, AlertCircle, Trash2, AlertTriangle, ShieldCheck, 
  Lock, Calendar, ShoppingCart, Printer, FileDown, Upload,
  Filter, Settings, Tag, Users, Eye, BarChart3, Edit, FileText,
  TrendingUp, Activity
} from 'lucide-react';

// === API 串接與本地雙軌模式服務 ===
const api = {
  async getInventory() {
    if (GAS_API_URL) {
      const res = await fetch(`${GAS_API_URL}?action=getInventory`);
      return await res.json();
    } else {
      // 本地快取模式
      const data = JSON.parse(localStorage.getItem('mockDB') || 'null');
      if (data) return data;
      const initial = {
        types: ['攝影器材', '收音設備', '配件', '其他'],
        items: [{ id: 'IT1001', name: 'MacBook Pro M2', type: '筆記型電腦', qty: 3, status: 'available' }],
        users: [
          { id: 'U_00000_0', name: '管理員測試', phoneLast5: '00000', role: 'admin', status: 'active' },
          { id: 'U_11111_1', name: '會員測試', phoneLast5: '11111', role: 'user', status: 'active' }
        ],
        reservations: []
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
      localStorage.setItem('mockDB', JSON.stringify(db));
    }
  }
};

const LOGO_FULL_URL = "data:image/png;base64,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"; 
const LOGO_ICON_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXUAAAHBCAYAAACWpiurAAAACXBIWXMAAAsTAAALEwEAmpwYAAAgT0lEQVR4nO3dDYic1b3H8V+WdDSlYKQFYyloTUCEXIzgFKXWCci1F1Q6UsRYhMRr7mBBF1srJq0ixVqV2hpWoTJom0DxBZGM9BZsSyGTKkrHi5EriJD1BUqN0JII4rbjcvdy4pk4bvZlZp7zPOft+wGLptnZR7Pz2//+z/+cs2ZhYUEAgDRM+X4AAIA7hDoAJIRQB4CEEOoAkBBCHQASQqgDQELW+n4AoAyN5vRZkq5e5bft73Zm3q3okYBKrGFOHaFpNKevlXTm4B8lnW7//iuSvjj0W0+RtK6kx5iT9K+hf35t6O9fkvS+pPe6nZmnS/r8wEQIdXjRaE7fKmmzpE2SzpV0qqT1itexofA/Kqkr6ZVuZ+YFz8+FzBDqqKry3ibp3yR9ucTqOuTA/4ekv0rq0PZBmQh1lFWFNyWdH3n1XSbzxvvAVvYEPZwh1FFYozl9iaTbJF0k6QzzdeX7mSJl+vh/k3RA0l5aN5gEoY4iLZVdth+eWzulKvOS3rUhfw+VPEZBqGOSIDcLnIzD+qnk/yLpl0zdYDmEOkZprTxMkAdZxb8u6fluZ2a374dBOAh1LJ5auVnSRt/PgsIV/C0stOaJUM/cUFW+nfZKkj34J1hkzQuhnqmhXrmZJWcEMY/2zI9YYE0foZ4ZWizZM7tbn+12Znb6fhCUg1DPK8zvZocnhnrv/y3pVlozaSHUE0eYYxUmAA6aNRXCPQ2EeqIIc4xpwZ5Dw9RM5Aj1xBDmcMAcG0zlHilCPRGEORyjLRMpQj2N0cS9TLOgJCYgnut2Zla7GhCBINTj3jS0T9KlzJmjommZBzlnJnyEeoQazenH2AEKj3PuV7GYGi5CPb6jbx+lb44AHDK3W9FvDw+hHlerpeH7WYAhtGQCRKjHMdXyM1otCNgRSdfQkgkDoR52df6ypA2+nwUYAVMygSDUA9RoTt8n6Q6mWhAhFlI9I9QDQnWORJhQeYBeux+Eeli9819QnSOxXvtFTMhUi1APQKM5/aqkLb6fAyhpQuZ6LueoDqHuf+7811zujAx0WEStBqHud1fof9JuQUZox1SAUPezGPonDuBCpmjHlGyq7E+Ak05UfINAR8bMJrqn7E+qKAGVekWYPQdOMtvtzGzy/RCpIdQr0GhOH+DcFmDZzUpb6LO7Q6iXiP45MJI5STfQZ3eDUC830E3/nHFFYHUmiK4j2ItjobS8+fO3CXRgZGatiQVUBwj1chZEn2RBFJjIjQR7MbRfHLJfjDf6fg4gAUzGTIhQd4QJF8A5gn0ChLoDjeb0YSZcgFIQ7GMi1Asi0IHScWbMGAj1Agh0oNJZ9vMI9tUR6hPghiLAC4J9BIT6mNhUBHhFsK+COfUxEOiAd+a994Z9L2IJhPp4DhHogHfr7HsRSyDUx1sUXe/7OQAct96+J7EIoT4CplyAIG0k2E9GqK+CQAeCRrAvQqivvvWfQAfCD/b9vh8iFIT6yodzcZYLEIcmpzt+glBf/vhcTlsE4ju291Zljs1HS19wwXnoQJwWcr9BiVAf0mhOXyLpIIEORG1B0ldz3XVKqFvsFgWSMpfrcQL01D9lDugi0IE0rJP0J2WIUP90dJETF4H0Rh0PKDPZh7qddGF0EUhTw77Hs5F1T51JFyALCzlNxGQb6iyMAlmZy2XhNOf2i1lEIdCBPKyT1FEGsgx1u52YM12AvGzJob+eXfuFPjqQtYXUNyblWKn/mkAHsrXG7klJVlah3mhOv0ofHcjehpTbMNm0X+zpbQ/5fg4AQZiXtCnFNsxURuOLP/P9HACCsTbVaZgsQt3+4Zk/RAAYnoYxgxNJmcqk7bLF93MACNKjSkzSoU7bBcAq1qe2aJp0qNN2ATCCHyghyYY6bRcAI1qb0qXVyYa6pJ/6fgAA0diuRCQZ6vZgfDYZAciuWp9K9PLoS30/B4DobFcCkgt1Sc9wtguAXKv1qQQXR7lrFEC21XpSoc7iKIDcq/VkQt3+QbA4CqCobytiUwntHI3+xyYAwewyvVaRSiLUJe1j5ygAh+5VpKI/T91W6W8z8QLAsbNjPG99KpEqnUAH4NoeRSjqUGejEYASfVMRijrUJe2lSgdQknUxLphORV6lb/T9HACStkuRmYq8SgeAMm1WZKYinng5x/dzAMhih+m1ikiUoc7EC4AK7VJEpiKt0pl4AVCVzYpIdKFOlQ6gYmtjasHEGOpf9/0AALKzTZGYivAkRs54AVC1rYpEVKEe+5GYAKI+ufEsRSCaULc9rfW+nwNAtm5SBKIJ9ZiPwgSQhP9QBKIIdftjD0cCAPDpXEUgilCP9QhMAElZpwjEEupX+n4AAGg0p29V4GIJ9b/7fgAAkNRU4GIJ9d/5fgAAUAR99VhC/R7fDwAAkr6kwEUR6vby1yO+nwNA9tYqcFGEukULBoB3jcAXS2MKdVowAEKwWQGLJtRpwQAIxCYFLJpQt2jBAPDtXAUstlA3LZgF3w8BIGunKmBRhbptwbzl+zkAZO00BSyqULee8f0AALK2RgFbs7AQXzej0Zz+OIZ5UQDJ+ka3M/OCAhRjpW687vsBAGTtQgUq1lC/xfcDAECIvIR6v9e6td9r3Tfpx9sfe465fSoAiH8Dkq9K/W5JOwq+xrOOngUAktmANOWjSrcXSG/o91oT387d7czsZGYdAPxX6jcP/f1dBV/rtYIfDwBJqTTU+73WJYsukL6i4EuyYAoAHiv1vYv+uWgLhgVTAPAR6ja8h6t0Vy0YFkwBwEOlvm+ZXy/UgmHBFAD8hPrXl/n1Qi0Y62DBjweAJFQS6v1e67FVzmrZU/BT3Fnw4wEgCVVV6t9e5f//ZpEXtwums0VeAwBSUHqo93uta+1mo5Wss+OORTxS8OMBIHpVVOr3jvj7Hi7ySbqdGdPCmSvyGgAwosPKMdRXGGMs64CcJxy8BgBEe/x32ZX6OAuga4uc3Dg03jhf5DUAIGZlh/qVY/7+oic3Gi86eA0AWMkryi3U7WmM4145t8HBgul2NiMBKFOoV9mVXakPn8Y4jp8U+aTdzsy7nN4IoERBt3inAlggHXXn6Tg4vRFAWT5UwMqq1IvsEHWxYMpmJABleUcZhnqhHaKOFkxdvAYA5B3qdgfpuoIvU3jBlGodQEm6yqxS3+XodQrtMLV+5OA1AGDYfmUW6ueH8jrdzszT3IwEwKF5O2GXR6jbBc41jl5ujT2yt6gfO3gNADCCDvQyKnXXi5PfKfoC9qAvqnUALhxQLqFuZ9M3yK11dmdqUVTrAFzYq4wq9aIXSC/njqIvQLUOwFE/PdjjAcoI9cKtkhLPgzGo1gEkedyu81C3oVt0Nr3UH3lstX7EzeMAyNDzioCrSv02lesc27Mv6hoHrwEgPwvdzsxuZRTqRY8FWI0Zk9xX9EXYZQpgQm8pElMRtF4GLnVUrXMmDIBxPaNIuKjUC51/Pma1XnjChmodwARTL1G0XlyFuovzz8e51ciFy7gdCUCKV2ROOTiRcdwr61TwrPXCRwfYsxsOunkkAIm7UxEpWql/V9Xb7vB1gr6WCoB3szFsOHIZ6l9T9VxW64UnagAkbYciMxXB1Etp1Xq3M7NT0pyL1wKQnNnYqvSilXrZG45Kr9atHzp6HQBp2aEITQW84aiqap3jAwAkUaVr0skVz62Xz1TrtXrbtFBcHB/wZwevg2JMK+xfiy74/WCJ33eapLOX+DVXF7QgbwuxVunGmoWF8ce1bevjRvk3X6u3P+fihRrNaXP4fcPFa2FZCzakB2HdGfppyZlGc3pwBv9mSZskfUXSFyV9oeIRXMSp2+3MbFVmof5eCRdiTOpxF9V6ozltjiA4zJveeeX9pj3d7neh/DhrQ38Q+OYuXKp8DMx1OzOfV8QmDfWQdmO6rNbNHau7XLxWpubtmdMmxB8N/YLeYY3mtGkpXiHpYhv0630/E7zYZi+szyfU7eXSoQWfk2rdaDSnj/KGHrsa/72kp2J/MyzWaE6bHdPbJF0U0E+mKE835rZLkVA3LYqNCq9C3FSrt991VLGZIwT4cXz1ivyWUFoqFbZtzNTVuQEMCsCtudjbLkVC/eNA+87dWr3t5Lssi6bLMqOfe2M6sa4s9pu/2atBFR+/BXO0dyoFylihbg/wekphMv8iX3VRrRuN5nSo37x8/Hd9LbeqfIJF9rtsT56Aj8+2lFqH44aW6S+GanA7kque2O2SHlLeYW7aUNtjWvD0wf732bko4M1F7LRowvd4SoE+SaUewyLiN2r1tpOKstGcflXSFuWFMHfbovmJvXOAn/rC001hYXTiULdXyZlNI6GbrdXbZv64sMxm1wnz8hdZbw5wyCDnYwA2KUHjhHqIo4zL+V6t3naySzGT2XVzvd8Oeubls4WC+dq8MpNiIUSzqQb6uKEeUyviWK3ePt3VizWa0yHtoHU9Y/5D19v0MVb1fkeiX1uh6qbYcpk01D+KbOHH5YYkU129ndDsuvlDf67bmbna94PgRO/9YbuTNZWvsVAXRXcqcSOFuj2VMbZTDJ1tSEqsDXNM0lW0WsIzNDljNjjRmnFnQdL3c/mJdNRQD+VURm8bkhKYhqE6j4gtIm6KYNoshhbj5TkVMaOGeohHA/gYcYx1GobqPO7zZ+6N+P3n06FuZ+YCZWbUUI95d6XrRdNbI9uUlPzCUGYz75fSdx+p9Xp7Lu2WsUM90n76YvfX6m1n55VEcjZMVn3EXNB3X1U3970Wo4R6rP300hZNjUZzOuRpINNHPC/nL+wc0Hc/6bC5a2gxjvadfmsi/54uz4UxLg/0iN6kN1bgU/a0zN22NbNX0jkBfj1WsV70Y34iHa9Sj7mfvti2Wr3t7PCeAMccs5jDxdIy261qdkE/QpiPGeqJ9NNLWzQ1Gs3pECaD6J8jh7NmOAZ6BFOr/P87lJb1/V5rv+PXvMz2sH1+oV9HoGOY+XqwbbizJXU8f40WZZ79cXNfghlRJNCLVeoxb7ZZ8ZYTV7Prnq/AY0EUkxxHsDmC9szgysT7Uzvv3HeohzzhEVobpur+OoGOopuavivpawG9xwnyCkJ9vAtM49Kp1dtOt8xXeIwAgY4yZt/NdNhZFVbxJl/el/SypJ/TVik51Pu9Vmw7J723YYxGc7rs26EIdFQR8qbgaUo6V9JpDqp5U4V/aBc6zXDBH6nGy7HSd2TzB5oy0//+rSSnbRhbqZd1PowZ47qMQEeZ7NeXWXjfs0zYy/bll9sPcdTu7DTeI7zDqdRTvRiiijaM6Vc+6XjhdK7bmfm8w9cDkNlI4xnKw7fsPL4ztjJ5wHXLxeHrAcgp1G3I5bLd2Px7/qGkLdxmPrgoeugAClfqVygv6/q9ljl50Sl7IYXpg0+KQAfgJNQvVn4a/V7L9MKdsrv6zKFD4zKLHQQ6ACehbi7AzdFv+r2WWeFXCRMxcxNs/SfQATgJdTOXmqO1diOEUzacz7OzuqMwgc4YGIDioZ7ZIulSNpRw6Ncg2K+3Vfhqx+cS6ACcVeoXTvZSSWmW1F83YX3dCsFuLsrlPHQATkM99Z2kXvvrKwT7kRxvPgdQfqibsx5QUn99mc1JZhH1ojI+F4C8LBXquS6SVtZfH9qc9Lit2G9g0gVAWaEeytnKIfXXzYmVztn+ubnNhYVRAO4P9LKLg0+5eemklHJMLwCUXamndnWd0/NhStqYBAClhXqOxwOMal1ZC6cAUFaoM/my+sKpubIOAKIIdSZfVrel32s95vshAGCUUGfyZTQ3ljURAwBOQt317T8Z+EUZRwkAgKtKnTNfxp+IeZJvhgCCnFO3N/80fD9QhI7fTlSrt9kRCpTM/nR85ii/t1Zv71GGCHU3CHbAAbsX5GqbRWfbv04puN43L+lDSe/Yv7qS9qf6fh0O9aOS1vt+oIjN1ertz/t+CCAmduCgacepv2QP0qvKvCQT7Kag3ZvKjvHhUP+I6ZfCZmv1trmTFMDy7ZNtkrYGWETOS3pd0vO1etscuBd9qK92Iw9GQ7ADQ/q91n2SrpF0VsWVeBEmD9+S9EhsvfnjoW77WKbXBDcIdmRtKMjPSeB6zHlJL0q6M4YWzSDUTV/rId8PkxiCHVmx470PS9ocUUU+rtnQq/dBqJvvqrt8P0yCCHYkzf6Uf5ek72S2JndM0rO1entnqKHOOGN5CHakXJWfn0B7pWhrZl9I4b7UzUdwa2O/1zrs+yEAF0yr1o4//9nev5BzoMu2mcxZUEdDOQ9qUKkzo16+I+Zy6VQ3PCBt9mTS7Qn3yl2+z6/xuaBKqFeLnaeIrV++z1zlSEU+tm6t3jaz+N5C/WO+A1eGYEfQCHOn7/UbavX20z5CnY1H1f9hXx7DzCuyW/zcm8hsebZVO6Huj/lvfl3V38WBFcJ8o+9nSdhcVYXcFBc9eD+PPYgVc+QZ5nYyy0yyEOjlMjP8B+2eoNJHGkc6mxilBftD3HmKKhHmXt/vu/q91v4yPwlz6mEwc66v+n4IpL8AajcaHiTMvWqWuXdlzb/+8l/77XnG8I9ZdjjHNEvQRw1scf1+N5X66S5fEIVskPQG6xxwXJm/bY8BIdDDst6+3803XWdov4S5oPJkFQsqSBdhHtX73Wmwm1A/zdWLwfmCinljAiMzi+52MyFhnmmwr7UXuyJMDXuEg/O+G9LC2SxpBLukwvcc036Jo+/2Nu0YrFKZ30igR2+di6kYM/3CYV7xOGQmlajaYTet/TSziyly0S1yrACVelzM+dVMx2Rs6Dxzc/0kgZ5u2/W+IpU6JzTGydvRnvBWmd/NT9VZnQ116SRnxZgwJ9DjZL6bfyTphyFfgotiCPNsrZH0h0kWTk2lzgmN8aPXnhjCHNahWr19gcZATz2dXruZkOFgsDSmWT6yPXMCHVvGPcmVSj3N8yRu4pz2uDBnjhXM1+rtz2lEhHq6ZiXt4HalKA7a+jphDleDEYR6+rqmAqTfHg6ujcOEvjFKkUZ1kL6G7bebM7QJd49sb/QOexonMK5nRrnUiEo9L+bP+jVJt9CWqbTFYkZOr6SIggPfW22EmVDPu+f+IxZUS63Kb6bFAseO1ertFe/AINRhpmWerdXbO30/SCK98tuoyuGzWifUMUBrZvL2yl2Svs1cOUKo1gl1LGVO0u8l/ZyAXzHIr2DRE55sW651SqhjNQT8J0FuTsbcJsnMClORw7fZWr29aan/g1DHOOYlvS7p+Vq9vVvp98d32BA3lTk9coTm7KVGlAl1FF1kNX34lyQ9GvMMvK3E/50QR0Q6tXr76sW/SKjDdSX/d0lvmi84Sa+E1rKxFfiFdlPW2fYv2imI0Vyt3j7paF5CHVVV9P+0YX/UHl1g7Hdd3Q+daHeGpIslnWaD+xRuCkIOC6aEOkJhvg4/mODjvkCrBBk7tPi8dd4MCIXZdUkbBBjP5sW/wCUZABCvtYsvoifUASBuZv/EZ0LdTCwAAOK0dXGof+jvWQAABX1mLYr2CwBEbvhyakIdAOLXHPwNoQ4A8Tt/ONTN2R0AgHiZndPHUakDQPzW2HONCHUASMQVg1A3x6YCAOJ28SDU3/f9JACAws41/0P7BQDScOog1Pf7fhIAgJsJmKmYryADAHzm+OoT7RcuygCAyJljeAehPsmNMwCAsJzJQikAJGQQ6hwVAADxa1KpA0BCBqHe8fwcAACHof6eixcDAPi1ZmHhk2nGfq/FWCMAxK073FPnAmoAiNv5w6HOBdQAELnhUH/H43MAABwg1AEg0VDvenwOAIDjUOcIXgCI2zsnQt0ewctYIwDE64PFxwRwWiMARGxxqHOwFwAkFOqHPT0HAKCEUP+jixcFAHhx+MTZLwOcAQMA0freUuepH/PwIAAAB5YKdRZLASBOrywV6i95eBAAQEG1evuFpUL9d0VfGABQueProVNLJT1nqwNAdI5vHl3u4mlzZAAAIB7/XCnUD1T7LACAgt5cKdT3Fn11AEClDi8b6vTVASA6r69UqRv01QEgHvtXC3X66gAQhwV7J8aKoU5fHQDicOIujGVD3fbV5yp7JADApE4c77JSpX5iRAYAELTDo4b6vvKfBQBQ0Im7ME46T32xfq/1f+b3Ff2MAIBy1OrtNaNW6sZbJT0HAKC4z9yBMUqoM9oIAOF6bdxQv6e8ZwEAFPTSWKFuB9qPFP2sAIBSPDpupW5wcQYAhGdusJN03FCnBQMA4TlpL9FIoU4LBgCC9PziXxi1UjdowQBAwP30cUPdtGBW3qkEAKjKscX99LFC3X4wG5EAIMD59EkqdeMZN88CACjol0v94qpnvyzW77U+lrS26NMAACY2X6u3P+eiUj9xDx4AwJtlrxudJNRvKfYsAICClm2Fj91+Mfq91lFJ64s+FQBgovtIp1xW6sazE34cAKCYFacQJwr1Wr29k5l1APBixSnESSt142CBjwUATNZ62V1WqN9Z4GMBAONbdQPoxKFeq7dfkDQ76ccDAMa26gbQIpW68UjBjwcAjL7haMXWS+FQr9Xbe8wh7UVeAwDgbuNn0UrdeMLBawAAHGz8nGjz0WKcBwMApR+ze3pVlbrxoqPXAQAU2PDpKtS3sxkJAEqbTTcbPqsLdXuBBpuRAKCiyzDKrtQNqnUAcO8WL6FOtQ4Azh2xGz29VOoGRwcAgDsPjPsBTkYah/V7rcOSNjp9UQDIz/xyV9ZVWakbl9FbB4DC9k3yQc4rdaPfax2Q1HD+wgCQh/lJqvSyKnWDSRgA8LChs5RQZxIGACa2YAtjhVSpG1TrADC+g7YwDivU7UM9V9brA0CCFopU6aUtlA7jBEcAGFm3Vm9vVQFltl8GHqzgcwCAcq/SK6nUjX6vdVTS+tI/EQBkXKVXVakbN1X0eQAgRvMuqvTKQr1Wbz8t6VAVnwsAIrSvyMSLj0rdaDLiCABL7h4d+RKMYELdfhf6VVWfDwAicbvLF6tkoXQYi6YAMP6F0iG2XwZYNAWAT1wlxyqv1I1+r/WqpC2Vf2IASGyEMYRKfbBoakZ4ACBH865GGIMIdbto6nRxAAAi8qCrEcYg2i8DtGEAZHqZ9Jllvbiv9ssAbRgAOVmQdE2Zn8BrqNOGAZCZ52r19gtlfgKv7ZcB2jAAMnDM9Ux6iO2XAdowAFK2UMZMerChbtsw1/t+DgCIte0SVPtloN9rHZDU8P0cABBb2yWoSn3A7q465vs5ACC2tkuQoW6Z/wDh/PgAAJN7oKq2S5Dtl4F+r3WfpF2+nwMACpit1dubVLEQK3XThtnNTUkAIjYn6TIfnzjIUDdq9fYF9j8MAMRkQdINZZ3tEm2oW+fRXwcQmV/Ze5m9CLKnPqzfa10r6SnfzwEAofbRY6rUZb/jPe77OQAg1D56VJX6QL/XOixpo+/nAIAlmCC9tOrxxSgr9QH7Iw0LpwBC9P0QAj2qUB9aOOXgLwAh6dTq7T0KRFShPnTwVxw9IwA5LIxerYBEFepDC6ff9/0cALJ3zPekSxKhbtgfdZiIAeDLXKgX+0QZ6kat3t5pelm+nwNAdhYkXe5rx2gyI43LYdQRQIUWJF3nc8dospX6gO1pzfp+DgDZjC4+rYBFX6kPULEDKNnjtu0btOgr9SFmey6bkwBkG+hJhbpdtDCbkwh2AFkGelLtl4F+r3WWpDckrfP9LACS2C16tSKSXKgbBDuAFI7Rzbr9MoxWDIAcAz3ZUDcIdgAT6sYa6EmH+qJgP+b7WQBEsyi6VRFLsqe+FObYAaQ05ZJlpT6MnacAUg/0rEJ9KNgP+X4OAMFYkHR/KoGeXagbtXr7Ao7tBaBPD+farYRkF+qG/a5sgj2PBQUAi82FftripLJZKF1Kv9e6VtKT5r+D72cBUGmgnxfqeehFZR3qRr/XukTSH9h9CmRhNuYZ9FFk2X4ZVqu3X7Cz7Ed8PwuA0s9x2aTEZV+pD+v3Wq+Geu8ggIktSHogtQXR5WRfqS8zGcN3OiCtBdHdygSV+vILqL+mzw5EbdZcnpPqguhyCPWVj+99WdIG388CIP1z0F0h1FfR77X2S2r6fg4AI5mXdH2K8+ejItRHb8f8RtJa388CYFmzObZbFiPUx2vH/ImTHoHgmBD7VUrntxRBqI+p32vdJ+kOdqECQTB3JVxl95uAUC+0C/W3ktb7fhYgUya4nst1MXQlhHrxRdRvUbUDlaI6XwGhXhBVO1AZqvMREOqOULUDpaI6HxGh7hBVO1DK3PmDOW3zL4pQLwETMoATXUnbc587HxehXu5ce4dTH4Gx0WopgFCvZjfqo7RkgJFaLbfX6u09vh8kZoR6tS2ZH3DUAHASplocItQr1u+1Dki6lH47cDzMD9I3d4tQ94B+O6BD5vRTwtw9Qt3/COReDglDZicp7mARtDyEejjh/gwXciBhhHlFCPWA9HutWyXdzaQMEkHP3ANCPdwxyHtpyyDi0cQXCXM/CPWA0XNHZOYkPcFlFX4R6vGE+08YhUTA/fJH2DQUBkI9vlFI88a5kk1M8IwWS6AI9bh3qO5gYgYVoyoPHKGeRmvmYUnn05pBmb1ySfdQlYePUE9Iv9d6TNIVVO9w1F55XdItzJbHhVBPt3q/jd47Jgzy+2v19tO+HwaTIdTzmHnfJWkzAY8lEOSJIdTz27F6s6Rz6L8r90sozGmhP6e1kh5CPVNU8NlV4+/a84UeZbEzbYQ6BgG/TdI3Ja3z/TwozLyp35f0sqSnaKvkhVDHUhuc7pK0VZL5e6r48BHiOIFQx6iTNBdJOoNefDBz429K+h9zNhB9cQwj1DFJyO+wlfyXaddUEuB/k/S/krrs5MRqCHW4aNeYC4Obks6V9CVaNhMvZn4o6TVJhyX9kTYKJkGoo8ygb0j6N0lf5OKP48yb7QNJ/5D0V0kvmV441TdcItThK+xPt+fVKKHAN/PfGgrto6ZlIuk9qm5UhVBHaKOVZ9rZ+U32l01L51T796dU1MMftEKGmbbIwGG7C9N4hYVKhIRQRwoLtxdO8rG0PZAiQh0AEjLl+wEAAO4Q6gCQEEIdABJCqANAQgh1AEgIoQ4ASsf/A+bH+QXudTuXAAAAAElFTkSuQmCC"; 

// === 系統全域樣式 (CSS) ===
const globalCss = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@100..900&family=Noto+Sans:ital,wght@0,100..900;1,100..900&family=Noto+Serif+TC:wght@200..900&family=Sekuya&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Kosugi+Maru&display=swap');

  body {
    background-color: #0b0b0e;
    margin: 0;
    color: #f1f5f9; 
    font-family: 'Kosugi Maru', 'Noto Sans', sans-serif;
  }

  body::before {
    content: "";
    position: fixed;
    inset: 0;
    background-image: url("https://i.pinimg.com/736x/fa/1c/ea/fa1ceaa99d579a7663a329c5714eae3d.jpg");
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    image-rendering: -webkit-optimize-contrast;
    opacity: 0.25;
    pointer-events: none;
    z-index: 0;
    mix-blend-mode: screen;
  }

  body::after {
    content: "";
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='2.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: 0.5; 
    pointer-events: none; 
    z-index: 9999;
    mix-blend-mode: overlay; 
  }

  .font-tc1 { font-family: 'Noto Serif TC', 'Sekuya', serif; }
  .font-tc2 { font-family: 'Kosugi Maru', 'Noto Sans', sans-serif; }
  
  .shadow-glass { box-shadow: inset 0 1px 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0, 0, 0, 0.5); }
  .shadow-btn { box-shadow: inset 0 1px 1px rgba(255,255,255,0.12), 0 6px 18px rgba(14, 165, 233, 0.14); }
  .shadow-btn-danger { box-shadow: inset 0 1px 1px rgba(255,255,255,0.12), 0 6px 18px rgba(138, 114, 123, 0.14); }
  .shadow-btn-success { box-shadow: inset 0 1px 1px rgba(255,255,255,0.12), 0 6px 18px rgba(118, 141, 131, 0.14); }

  .space-light-ball {
    position: absolute;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.9), 
                0 0 25px 8px rgba(255, 255, 255, 0.5),
                0 0 60px 15px rgba(255, 255, 255, 0.2); 
    z-index: 1; 
  }

  .flicker-1 { animation: breathingFlicker 4s infinite alternate ease-in-out; }
  .flicker-2 { animation: breathingFlicker 6s infinite alternate-reverse ease-in-out; }
  .flicker-3 { animation: breathingFlicker 5s infinite alternate ease-in-out; }

  @keyframes breathingFlicker {
    0% { opacity: 0.8; transform: scale(0.95); box-shadow: 0 0 8px 2px rgba(255, 255, 255, 0.8), 0 0 20px 5px rgba(255, 255, 255, 0.4); }
    50% { opacity: 1; transform: scale(1.05); box-shadow: 0 0 12px 3px rgba(255, 255, 255, 1), 0 0 30px 10px rgba(255, 255, 255, 0.6); }
    100% { opacity: 0.85; transform: scale(0.98); box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.9), 0 0 25px 8px rgba(255, 255, 255, 0.5); }
  }

  ::-webkit-scrollbar { width: 8px; }
  ::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.3); }
  ::-webkit-scrollbar-thumb { background: #0ea5e9; border-radius: 8px; }
  
  ::-webkit-calendar-picker-indicator { filter: invert(1); }

  @keyframes popBadge {
    0% { transform: scale(1); }
    30% { transform: scale(1.6); background-color: #f87171; box-shadow: 0 0 20px rgba(239, 68, 68, 0.9); }
    70% { transform: scale(1.3); background-color: #ef4444; box-shadow: 0 0 15px rgba(239, 68, 68, 0.7); }
    100% { transform: scale(1); }
  }

  @keyframes pageReveal { 0% { opacity: 0; } 100% { opacity: 1; } }
  .page-reveal { animation: pageReveal 0.72s ease-out; will-change: opacity; }

  @keyframes contentReveal { 0% { opacity: 0; transform: translateY(18px); } 100% { opacity: 1; transform: translateY(0); } }
  .content-reveal { animation: contentReveal 0.82s cubic-bezier(0.22, 1, 0.36, 1); will-change: opacity, transform; }

  @keyframes searchFadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
  .search-fade { animation: searchFadeIn 0.42s ease-in-out; will-change: opacity; pointer-events: none; }
  .search-fade .toolbar-shell, .search-fade .toolbar-leading, .search-fade .toolbar-morph, .search-fade .circle-add-btn, .search-fade input, .search-fade select, .search-fade button { pointer-events: auto; }
  
  .circle-add-btn {
    padding: 0 !important; min-width: 2.75rem !important; max-width: 2.75rem !important; width: 2.75rem !important;
    min-height: 2.75rem !important; height: 2.75rem !important; max-height: 2.75rem !important; line-height: 1 !important;
    aspect-ratio: 1 / 1 !important; border-radius: 9999px !important; background: transparent !important;
    border: 1px solid rgba(255,255,255,0.16) !important; color: rgba(237,247,255,0.88) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 14px rgba(0,0,0,0.14) !important;
  }
  .circle-add-btn:hover:not(:disabled) { border-color: rgba(125, 168, 201, 0.28) !important; color: rgba(245,250,255,0.98) !important; }
  .circle-add-btn:active:not(:disabled) {
    background: rgba(14, 165, 233, 0.88) !important; border-color: rgba(14, 165, 233, 0.92) !important; color: #ffffff !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px rgba(14,165,233,0.24), 0 0 14px rgba(14,165,233,0.22) !important;
    transform: scale(0.94);
  }

  .press-reveal-btn {
    background: transparent !important; border: 1px solid rgba(255,255,255,0.12) !important;
    color: rgba(233,240,247,0.90) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 14px rgba(0,0,0,0.14) !important;
  }
  .press-reveal-btn:hover:not(:disabled) { border-color: rgba(255,255,255,0.18) !important; color: #ffffff !important; }
  .press-reveal-btn:active:not(:disabled) {
    background: rgba(14, 165, 233, 0.88) !important; border-color: rgba(14, 165, 233, 0.92) !important; color: #ffffff !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px rgba(14,165,233,0.24), 0 0 14px rgba(14,165,233,0.22) !important;
    transform: scale(0.97);
  }

  .toolbar-shell { display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:nowrap; min-width:0; }
  .search-fade .toolbar-shell { justify-content: flex-end; background: transparent !important; border: 0 !important; box-shadow: none !important; }
  .toolbar-leading { display:flex; align-items:center; gap:0.75rem; min-width:0; flex:1; }
  .search-fade .toolbar-leading { justify-content: flex-end; margin-left: auto; }
  
  .search-fade .toolbar-morph {
    display: flex; align-items: center; justify-content: flex-end; width: 2.75rem; min-width: 2.75rem; height: 2.75rem;
    border-radius: 9999px; overflow: hidden; flex-shrink: 0; transition: width 0.34s cubic-bezier(0.22, 0.61, 0.36, 1), background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    background: transparent; border: 1px solid rgba(255,255,255,0.16); box-shadow: inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 14px rgba(0,0,0,0.14);
  }
  .search-fade .toolbar-morph.is-open { width: 12.5rem; background: rgba(0,0,0,0.38); border-color: rgba(255,255,255,0.2); }
  .search-fade .toolbar-morph-btn { width: 2.75rem; min-width: 2.75rem; height: 2.75rem; display: flex; align-items: center; justify-content: center; border: 0; background: transparent; color: rgba(237,247,255,0.88); cursor: pointer; flex-shrink: 0; padding: 0; }
  .search-fade .toolbar-morph-field {
    width: 0; opacity: 0; border: 0; outline: none; background: transparent; color: #fff; pointer-events: none;
    transition: opacity 0.18s ease, width 0.34s cubic-bezier(0.22, 0.61, 0.36, 1); font-size: 13px; letter-spacing: 0.08em; padding: 0; appearance: none; -webkit-appearance: none; -moz-appearance: none;
  }
  .search-fade .toolbar-morph.is-open .toolbar-morph-field { width: calc(100% - 2.75rem); opacity: 1; pointer-events: auto; padding-right: 0.9rem; }
  .search-fade .toolbar-morph-select { cursor: pointer; }
  @media (max-width: 767px) {
    .search-fade .toolbar-morph, .search-fade .toolbar-morph-btn { width: 2.5rem; min-width: 2.5rem; height: 2.5rem; }
    .search-fade .toolbar-morph.is-open { width: min(11rem, calc(100vw - 9rem)); }
    .search-fade .toolbar-morph.is-open .toolbar-morph-field { width: calc(100% - 2.5rem); }
    .toolbar-shell { gap:0.5rem; } .toolbar-leading { gap:0.5rem; }
  }
`;

// === 輔助函式 ===
const isDateOverlap = (startD1, startT1, endD1, endT1, startD2, startT2, endD2, endT2) => {
  const dtStart1 = new Date(`${startD1}T${startT1 || '00:00'}`).getTime();
  const dtEnd1 = new Date(`${endD1}T${endT1 || '23:59'}`).getTime();
  const dtStart2 = new Date(`${startD2}T${startT2 || '00:00'}`).getTime();
  const dtEnd2 = new Date(`${endD2}T${endT2 || '23:59'}`).getTime();
  return dtStart1 < dtEnd2 && dtEnd1 > dtStart2; 
};

const generateResId = (reservations) => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `ch${yyyy}${mm}${dd}`;
  
  const todayRes = reservations.filter(r => r?.id?.startsWith(prefix));
  const maxNum = todayRes.reduce((max, r) => {
    const numStr = r.id.replace(prefix, '');
    const num = parseInt(numStr, 10);
    return !isNaN(num) && num > max ? num : max;
  }, 0);
  
  return `${prefix}${String(maxNum + 1).padStart(2, '0')}`;
};

// === 元件定義 ===
const Button = ({ children, onClick, variant = 'primary', className = '', type = "button", ...props }) => {
  const baseStyle = "px-4 py-2 rounded-full font-medium tracking-wider transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-[13px] md:text-[15px]";
  const variants = {
    primary: "bg-sky-500/[0.34] text-[#edf7ff] hover:bg-sky-500/[0.28] active:bg-sky-500 border border-sky-500/20 shadow-btn",
    secondary: "bg-white/[0.045] text-gray-200 border border-white/8 hover:bg-white/[0.07] active:bg-white/[0.05]",
    danger: "bg-[#5b4f55]/[0.34] text-[#eadfe3] hover:bg-[#5b4f55]/[0.28] active:bg-[#5b4f55]/[0.22] border border-[#8d7a83]/[0.18] shadow-btn-danger",
    success: "bg-[#53635d]/[0.34] text-[#e4efe9] hover:bg-[#53635d]/[0.28] active:bg-[#53635d]/[0.22] border border-[#83958d]/[0.18] shadow-btn-success",
    ghost: "bg-transparent text-gray-300 hover:bg-white/[0.06] hover:text-white"
  };
  return <button type={type} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Badge = ({ status, type = 'item' }) => {
  const styles = {
    available: "bg-[#33463f]/30 text-[#b6c9bf] border-[#5d7469]/22",
    borrowed: "bg-[#4f454b]/30 text-[#cab8bf] border-[#7c666d]/22",
    maintenance: "bg-[#4f454b]/30 text-[#cab8bf] border-[#7c666d]/22",
    inquire: "bg-[#4f454b]/30 text-[#cab8bf] border-[#7c666d]/22",
    active: "bg-sky-500/[0.18] text-[#bfe6ff] border-sky-500/24",
    returned: "bg-white/[0.04] text-gray-400 border-white/10",
    renewable: "bg-[#33463f]/30 text-[#b6c9bf] border-[#5d7469]/22",
    '審核中': "bg-[#4f454b]/30 text-[#cab8bf] border-[#7c666d]/22",
    '已借出': "bg-sky-500/[0.18] text-[#bfe6ff] border-sky-500/24",
    '已退回': "bg-white/[0.04] text-gray-400 border-white/10",
    '已歸還': "bg-white/[0.04] text-gray-400 border-white/10",
    admin: "bg-[#4f454b]/30 text-[#cab8bf] border-[#7c666d]/22",
    user: "bg-white/[0.04] text-gray-400 border-white/10"
  };

  const labels = {
    available: "在架上", borrowed: "已出借", maintenance: "維修中",
    inquire: "請洽詢", active: "使用中", returned: "已歸還",
    renewable: "可續借", '審核中': "審核中", '已借出': "已借出",
    '已退回': "已退回", '已歸還': "已歸還", admin: "管理員", user: "一般用戶"
  };

  let label = labels[status] || status;
  if (type === 'user') {
    if (status === 'active') label = '已啟用';
    if (status === 'pending') label = '待審核';
  }

  return <span className={`px-3 py-1 rounded-full text-[11px] md:text-xs font-medium tracking-wider border whitespace-nowrap leading-none ${styles[status] || styles.available}`}>{label}</span>;
};

const Modal = ({ isOpen, onClose, title, children, type = "default", size = "md", placement = "center" }) => {
  if (!isOpen) return null;
  const headerColor = type === "danger" ? "text-[#c4a8b2]" : "text-white";
  const maxWidth = size === "lg" ? "max-w-2xl" : (size === "sm" ? "max-w-md" : "max-w-lg");
  return (
    <div className={`fixed inset-0 z-[60] flex ${placement === "top" ? "items-start justify-center pt-24 md:pt-28" : "items-center justify-center"} p-4 bg-black/70 backdrop-blur-sm print:hidden`}>
      <div className={`bg-black/60 backdrop-blur-3xl border border-white/20 rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto transform transition-all`}>
        <div className="flex justify-between items-center p-6 border-b border-white/10 sticky top-0 bg-black/40 z-10">
          <h3 className={`text-lg md:text-xl font-bold tracking-wider whitespace-nowrap ${headerColor} flex items-center gap-2`}>
            {type === "danger" && <AlertTriangle size={24} />}
            {title}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        <div className="p-6 text-gray-200">{children}</div>
      </div>
    </div>
  );
};

const Dialog = ({ dialog, closeDialog }) => {
  if (!dialog.isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm print:hidden">
      <div className="bg-black/60 backdrop-blur-3xl border border-white/20 rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100">
        <h3 className="text-[15px] md:text-[17px] font-bold tracking-wider mb-3 flex items-center gap-2 text-white whitespace-nowrap">
          {dialog.type === 'confirm' ? <AlertTriangle className="text-[#c4a8b2]" size={24}/> : <AlertCircle className="text-sky-500" size={24}/>}
          {dialog.type === 'confirm' ? '請確認操作' : '系統提示'}
        </h3>
        <p className="text-[13px] md:text-[15px] text-gray-300 mb-6 whitespace-pre-wrap leading-relaxed tracking-wider">{dialog.message}</p>
        <div className="flex justify-end gap-3">
          {dialog.type === 'confirm' && (
            <Button variant="secondary" onClick={closeDialog}>取消</Button>
          )}
          <Button variant={dialog.type === 'confirm' ? 'danger' : 'primary'} onClick={() => {
            if (dialog.onConfirm) dialog.onConfirm();
            closeDialog();
          }}>
            確定
          </Button>
        </div>
      </div>
    </div>
  );
};

const LoginScreen = ({ onLogin, onRegister, authError, authSuccess, clearAuthMsg }) => {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', phoneLast5: '' });
  const [loginCode, setLoginCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'login') {
      onLogin(loginCode);
    } else {
      onRegister(form);
      setMode('login');
      setForm({ name: '', phoneLast5: '' }); 
      setLoginCode('');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-transparent flex items-center justify-center p-4 relative">
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl shadow-glass w-full max-w-md transition-all duration-300 z-10">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="h-16 md:h-20 w-auto flex items-center justify-center mb-4 relative">
            <img src={LOGO_ICON_URL} alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
          </div>
          <p className="text-gray-400 mt-2 text-sm tracking-widest">{mode === 'login' ? '請輸入密碼' : '註冊新帳號'}</p>
        </div>

        {authSuccess && <div className="mb-4 p-3 bg-[#61756c]/[0.34] border border-[#83958d]/[0.34] text-[#d7e7df] text-sm tracking-wider rounded-xl flex items-center gap-2"><CheckCircle size={16} />{authSuccess}</div>}
        {authError && <div className="mb-4 p-3 bg-[#66545c]/[0.34] border border-[#8a727b]/[0.34] text-[#eadce2] text-sm tracking-wider rounded-xl flex items-center gap-2"><AlertCircle size={16} />{authError}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'login' ? (
             <div>
               <div className="relative">
                 <Lock className="absolute left-3 top-2.5 text-gray-500" size={18} />
                 <input 
                   type="text" 
                   maxLength="5"
                   pattern="\d{5}"
                   value={loginCode} 
                   onChange={(e) => setLoginCode(e.target.value)} 
                   className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-center text-xl md:text-2xl tracking-widest font-bold text-white placeholder-gray-600 transition-all shadow-inner" 
                   placeholder="_____" 
                   required 
                 />
               </div>
             </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-widest">會員名稱</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={(e) => setForm({...form, name: e.target.value})} 
                  className="w-full px-4 py-2 bg-black/40 text-white border border-white/20 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-inner" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-widest">會員密碼</label>
                <input 
                  type="text" 
                  maxLength="5"
                  pattern="\d{5}"
                  value={form.phoneLast5} 
                  onChange={(e) => setForm({...form, phoneLast5: e.target.value})} 
                  className="w-full px-4 py-2 bg-black/40 text-white border border-white/20 rounded-xl outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all shadow-inner" 
                  placeholder="例如: 12345"
                  required 
                />
              </div>
            </>
          )}
          
          <Button type="submit" className="w-full justify-center mt-8 py-3 text-[15px] md:text-[17px] rounded-full transform active:scale-[0.97] active:bg-sky-500 active:text-white active:shadow-[0_0_14px_rgba(14,165,233,0.22)] transition-all duration-150">
            {mode === 'login' ? '登入' : '送出註冊'}
          </Button>

          <div className="text-center mt-6">
            <span className="text-sm text-gray-400 tracking-wider">{mode === 'login' ? '找不到帳號？' : '已經有帳號？'}</span>
            <button 
              type="button" 
              onClick={() => { 
                setMode(mode === 'login' ? 'register' : 'login'); 
                clearAuthMsg(); 
                setForm({ name: '', phoneLast5: '' });
                setLoginCode('');
              }} 
              className="ml-2 text-sm text-sky-500 font-bold tracking-wider hover:text-sky-300 hover:underline transition-all whitespace-nowrap"
            >
              {mode === 'login' ? '申請加入' : '返回登入'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ItemCard = ({ item, reservations, onAddToCart, currentUser }) => {
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const pressTimer = useRef(null);
  const isPressing = useRef(false);

  const handleTouchStart = () => {
    isPressing.current = false;
    pressTimer.current = setTimeout(() => {
      setShowMobileDetails(true);
      isPressing.current = true;
      if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 300); 
  };

  const handleTouchMove = () => {};

  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    setShowMobileDetails(false);
    isPressing.current = false;
  };

  const handleMouseDown = () => {
    isPressing.current = false;
    pressTimer.current = setTimeout(() => {
      setShowMobileDetails(true);
      isPressing.current = true;
    }, 300);
  };

  const handleMouseMove = () => {};

  const handleMouseUpOrLeave = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    setShowMobileDetails(false);
    isPressing.current = false;
  };

  const itemReservations = reservations
    .filter(r => r.status === '已借出')
    .flatMap(r => r.items
      .filter(i => i.itemId === item.id || i.name === item.name)
      .map(i => ({ ...i, userId: r.userId, userName: r.userName }))
    );

  const now = new Date();
  const currentUses = itemReservations
    .filter(i => {
      const start = new Date(`${i.startDate}T${i.startTime || '00:00'}`);
      const effectiveStart = new Date(start.getTime() - 2 * 60 * 60 * 1000);
      const end = new Date(`${i.endDate}T${i.endTime || '23:59'}`);
      return now >= effectiveStart && now <= end;
    });

  const currentlyUsedQty = currentUses.reduce((sum, i) => sum + (i.borrowQty || 1), 0);
  const currentRemainingQty = item.qty - currentlyUsedQty;
  const isOutOfStock = currentRemainingQty <= 0;
  
  const isCurrentlyBorrowedByMe = currentUses.some(i => i.userId === currentUser?.id || i.userName === currentUser?.name);
  
  let displayStatus = item.status;
  if (displayStatus !== 'maintenance' && displayStatus !== 'inquire') {
    if (isCurrentlyBorrowedByMe) {
      displayStatus = 'renewable';
    } else {
      displayStatus = isOutOfStock ? 'borrowed' : 'available';
    }
  }

  return (
    <div 
      className={`bg-white/5 backdrop-blur-xl rounded-3xl shadow-glass border border-white/10 p-4 md:p-6 flex flex-col hover:-translate-y-1 hover:bg-white/10 transition-all select-none ${displayStatus !== 'available' && displayStatus !== 'renewable' ? 'opacity-80' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onContextMenu={(e) => { 
        if (window.innerWidth < 768) e.preventDefault(); 
      }}
    >
      <div className="flex flex-col gap-2.5 md:gap-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3">
              <h3 className="font-bold text-[15px] md:text-[17px] text-white tracking-wider line-clamp-2 leading-snug whitespace-normal break-words flex-1 min-w-0">
                {item.name}
              </h3>
              <button 
                className={`circle-add-btn flex-shrink-0 flex items-center justify-center text-2xl font-bold transition-all duration-150 ${displayStatus === 'available' || displayStatus === 'renewable' ? '' : 'text-gray-500 border-white/10 cursor-not-allowed opacity-60'}`}
                disabled={displayStatus !== 'available' && displayStatus !== 'renewable'} 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  if (displayStatus === 'available' || displayStatus === 'renewable') {
                    onAddToCart && onAddToCart(item); 
                  }
                }}
                title={displayStatus === 'available' ? '加入預約單' : (displayStatus === 'renewable' ? '申請續借' : '暫不可借用')}
                aria-label={displayStatus === 'available' ? '加入預約單' : (displayStatus === 'renewable' ? '申請續借' : '暫不可借用')}
              >
                {displayStatus === 'available' || displayStatus === 'renewable' ? <Plus size={18} strokeWidth={2.5} /> : <X size={18} strokeWidth={2.5} />}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center bg-black/40 text-gray-300 border border-white/10 text-[11px] md:text-xs px-3 py-1 rounded-full shadow-sm tracking-wider whitespace-nowrap leading-none">{item.type}</span>
          <span className={`inline-flex items-center text-[11px] md:text-xs font-semibold px-3 py-1 rounded-full border shadow-sm tracking-wider whitespace-nowrap leading-none ${isOutOfStock ? 'text-[#eadce2] bg-[#66545c]/[0.38] border-[#8a727b]/[0.34]' : 'text-[#d4eeff] bg-sky-500/[0.22] border-sky-500/[0.28]'}`}>
            剩餘: {currentRemainingQty > 0 ? currentRemainingQty : 0} / {item.qty}
          </span>
          <Badge status={displayStatus} />
        </div>
      </div>

      <div className={`grid md:flex ${showMobileDetails ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} md:opacity-100 mt-4 md:mt-4 transition-all duration-500 ease-in-out border-t md:border-t-0 border-white/10 pt-4 md:pt-0 flex-1 overflow-hidden`}>
        <div className="min-h-0">
          <p className="text-xs md:text-sm text-gray-400 mb-3 line-clamp-2 tracking-wider">配件: {item.accessories || '無'}</p>
        
          {itemReservations.length > 0 && (
            <div className="mb-4 bg-[#4d3c43]/30 border border-[#7c666d]/40 p-3 rounded-2xl text-xs md:text-sm text-[#c2acb3]">
              <p className="font-bold mb-1 flex items-center gap-1 tracking-wider whitespace-nowrap"><Calendar size={12}/> 已被預約時段：</p>
              <ul className="list-disc pl-4 space-y-1">
                {itemReservations.map((ir, idx) => (
                  <li key={idx} className="tracking-wider">{ir.startDate} {ir.startTime || '00:00'} ~ {ir.endDate} {ir.endTime || '23:59'} <span className="font-bold whitespace-nowrap">(借 {ir.borrowQty} 件)</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const UserDashboard = ({ items = [], itemTypes = [], reservations = [], onAddToCart, isSimulatingUser, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchInputRef = useRef(null);
  const filterSelectRef = useRef(null);

  const openSearchMorph = () => {
    setIsSearchOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  const closeSearchMorph = () => {
    if (!searchTerm.trim()) setIsSearchOpen(false);
  };

  const openFilterMorph = () => {
    setIsFilterOpen(true);
    requestAnimationFrame(() => {
      const el = filterSelectRef.current;
      if (!el) return;
      el.focus();
      try { el.showPicker?.(); } catch (e) {}
    });
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="w-full">
      <div className="search-fade fixed left-0 right-0 z-40 bg-[#05050A]/78 backdrop-blur-2xl border-b border-white/10 px-4 md:px-8 py-3 transition-opacity shadow-[0_10px_30px_rgba(0,0,0,0.7)]" style={{top: isSimulatingUser ? "104px" : "64px"}}>
        <div className="max-w-7xl mx-auto toolbar-shell">
          <div className="toolbar-leading">
            <div className={`toolbar-morph ${isFilterOpen ? 'is-open' : ''}`}>
              <button type="button" className="toolbar-morph-btn" onMouseDown={openFilterMorph} onTouchStart={openFilterMorph} onClick={openFilterMorph} aria-label="展開類型選單">
                <Filter size={18} />
              </button>
              <select 
                ref={filterSelectRef}
                className="toolbar-morph-field toolbar-morph-select"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                onBlur={() => setIsFilterOpen(false)}
              >
                <option value="all">所有類型</option>
                {itemTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className={`toolbar-morph ${isSearchOpen ? 'is-open' : ''}`}>
              <button type="button" className="toolbar-morph-btn" onMouseDown={openSearchMorph} onTouchStart={openSearchMorph} onClick={openSearchMorph} aria-label="展開搜尋欄">
                <Search size={18} />
              </button>
              <input 
                ref={searchInputRef}
                className="toolbar-morph-field toolbar-morph-input"
                placeholder="搜尋物件名稱..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={closeSearchMorph}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="content-reveal pt-28 md:pt-28 space-y-6 relative z-10">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl py-16 rounded-3xl border border-white/10 shadow-glass px-4">
            <Package size={64} className="text-gray-600 mb-4" />
            <h3 className="text-lg md:text-xl font-bold text-gray-300 tracking-wider text-center whitespace-nowrap">目前沒有符合的器材</h3>
            <p className="text-gray-500 mt-2 text-xs md:text-sm max-w-md text-center tracking-wider">
              若是剛開啟系統，資料可能還在載入中；或者您可以嘗試更換上方的關鍵字與分類。
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <ItemCard 
                key={item.id} 
                item={item} 
                reservations={reservations} 
                onAddToCart={onAddToCart} 
                currentUser={currentUser}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AdminDashboard = ({ items = [], users = [], reservations = [] }) => {
  const stats = useMemo(() => {
    const itemCounts = {}; 
    const userRequestCounts = {}; 
    const userDistinctItems = {};

    reservations.filter(r => r.status === '已借出' || r.status === '已歸還').forEach(r => {
      userRequestCounts[r.userId] = (userRequestCounts[r.userId] || 0) + 1;
      if (!userDistinctItems[r.userId]) userDistinctItems[r.userId] = new Set();
      r.items.forEach(item => {
        const idToUse = item.itemId || item.name;
        itemCounts[idToUse] = (itemCounts[idToUse] || 0) + (item.borrowQty || 1);
        userDistinctItems[r.userId].add(idToUse);
      });
    });

    const topItems = Object.keys(itemCounts)
      .map(id => ({ name: items.find(i => i.id === id || i.name === id)?.name || id, count: itemCounts[id] }))
      .sort((a, b) => b.count - a.count).slice(0, 5);
    
    const topUserRequests = Object.keys(userRequestCounts)
      .map(id => ({ name: users.find(u => u.id === id)?.name || id, count: userRequestCounts[id] }))
      .sort((a, b) => b.count - a.count).slice(0, 5);

    const topUserDistinct = Object.keys(userDistinctItems)
      .map(id => ({ name: users.find(u => u.id === id)?.name || id, count: userDistinctItems[id].size }))
      .sort((a, b) => b.count - a.count).slice(0, 5);

    const maxItemCount = Math.max(...topItems.map(i => i.count), 1);
    const maxReqCount = Math.max(...topUserRequests.map(u => u.count), 1);
    const maxDistCount = Math.max(...topUserDistinct.map(u => u.count), 1);

    return { topItems, topUserRequests, topUserDistinct, maxItemCount, maxReqCount, maxDistCount };
  }, [items, reservations, users]);

  const BarChart = ({ data, max, color = "bg-sky-500", labelSuffix = "次" }) => (
    <div className="space-y-3">
      {data.length > 0 ? data.map((d, idx) => (
        <div key={idx} className="flex items-center gap-3">
          <div className="w-24 md:w-28 text-xs md:text-sm text-gray-300 truncate text-right font-medium tracking-wider">{d.name}</div>
          <div className="flex-1 h-3 md:h-4 bg-black/40 rounded-full overflow-hidden border border-white/10 shadow-inner">
            <div 
              className={`h-full ${color} rounded-full transition-all duration-500 shadow-[0_0_10px_currentColor] opacity-90`} 
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <div className="w-10 md:w-12 text-[10px] md:text-xs text-gray-400 tracking-widest whitespace-nowrap">{d.count} {labelSuffix}</div>
        </div>
      )) : <p className="text-center text-gray-500 text-sm py-4 tracking-widest">尚無數據</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="content-reveal grid md:grid-cols-2 gap-6 relative z-10">
        <div className="bg-white/5 backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-glass border border-white/10">
          <h3 className="font-bold text-[13px] md:text-[15px] text-gray-200 mb-4 border-b border-white/10 pb-3 flex items-center gap-2 tracking-wider whitespace-nowrap"><TrendingUp size={18} className="text-sky-500"/> 熱門器材 (總借出件數)</h3>
          <BarChart data={stats.topItems} max={stats.maxItemCount} color="bg-sky-500" labelSuffix="件" />
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-glass border border-white/10">
          <h3 className="font-bold text-[13px] md:text-[15px] text-gray-200 mb-4 border-b border-white/10 pb-3 flex items-center gap-2 tracking-wider whitespace-nowrap"><Users size={18} className="text-[#b1c8be]"/> 會員活躍度 (申請次數)</h3>
          <BarChart data={stats.topUserRequests} max={stats.maxReqCount} color="bg-[#61756c]" labelSuffix="次" />
        </div>

        <div className="bg-white/5 backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-glass border border-white/10 md:col-span-2">
          <h3 className="font-bold text-[13px] md:text-[15px] text-gray-200 mb-4 border-b border-white/10 pb-3 flex items-center gap-2 tracking-wider whitespace-nowrap"><Activity size={18} className="text-[#c4a8b2]"/> 探索廣度 (借過不同物件數)</h3>
          <BarChart data={stats.topUserDistinct} max={stats.maxDistCount} color="bg-[#66545c]" labelSuffix="種" />
        </div>
      </div>
    </div>
  );
};

const AdminUsers = ({ users = [], onUpdateUser, onAddUser, showAlert }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchInputRef = useRef(null);
  const filterSelectRef = useRef(null);
  const [formData, setFormData] = useState({ name: '', phoneLast5: '', role: 'user', department: '' });

  const openSearchMorph = () => {
    setIsSearchOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  const closeSearchMorph = () => {
    if (!searchTerm.trim()) setIsSearchOpen(false);
  };

  const openFilterMorph = () => {
    setIsFilterOpen(true);
    requestAnimationFrame(() => {
      const el = filterSelectRef.current;
      if (!el) return;
      el.focus();
      try { el.showPicker?.(); } catch (e) {}
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || (user.phoneLast5 || '').includes(searchTerm);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name, phoneLast5: user.phoneLast5, role: user.role, department: user.department || '' });
    } else {
      setEditingUser(null);
      setFormData({ name: '', phoneLast5: '', role: 'user', department: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser({ ...editingUser, ...formData });
    } else {
      onAddUser(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="search-fade fixed left-0 right-0 z-40 bg-[#05050A]/78 backdrop-blur-2xl border-b border-white/10 px-4 md:px-8 py-3 transition-opacity shadow-[0_10px_30px_rgba(0,0,0,0.7)]" style={{top: "64px"}}>
        <div className="max-w-7xl mx-auto toolbar-shell">
          <div className="toolbar-leading">
            <div className={`toolbar-morph ${isFilterOpen ? 'is-open' : ''}`}>
              <button type="button" className="toolbar-morph-btn" onMouseDown={openFilterMorph} onTouchStart={openFilterMorph} onClick={openFilterMorph} aria-label="展開類型選單">
                <Filter size={18} />
              </button>
              <select
                ref={filterSelectRef}
                className="toolbar-morph-field toolbar-morph-select"
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
                onBlur={() => setIsFilterOpen(false)}
              >
                <option value="all">所有類型</option>
                <option value="user">一般使用者</option>
                <option value="admin">管理員</option>
              </select>
            </div>
            <div className={`toolbar-morph ${isSearchOpen ? 'is-open' : ''}`}>
              <button type="button" className="toolbar-morph-btn" onMouseDown={openSearchMorph} onTouchStart={openSearchMorph} onClick={openSearchMorph} aria-label="展開搜尋欄">
                <Search size={18} />
              </button>
              <input
                ref={searchInputRef}
                className="toolbar-morph-field toolbar-morph-input"
                placeholder="搜尋會員姓名或密碼..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={closeSearchMorph}
              />
            </div>
            <Button onClick={() => handleOpenModal()} title="新增會員" aria-label="新增會員" className="circle-add-btn shrink-0 transition-all duration-150"><Plus size={18} /></Button>
          </div>
        </div>
      </div>

      <div className="content-reveal mt-6 bg-white/5 backdrop-blur-xl rounded-2xl shadow-glass border border-white/10 overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] md:text-[15px] whitespace-nowrap tracking-wider">
            <thead className="bg-black/40 border-b border-white/10 text-gray-300">
              <tr>
                <th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">姓名</th>
                <th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">手機末五碼</th>
                <th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">狀態</th>
                <th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">權限</th>
                <th className="p-4 text-right font-semibold">編輯</th>
              </tr>
            </thead>
            <tbody className="text-gray-200">
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3.5 font-medium text-white">{user.name}</td>
                  <td className="px-4 py-3.5 font-mono text-gray-400">{user.phoneLast5 || '未設定'}</td>
                  <td className="px-4 py-3.5"><Badge status={user.status} type="user" /></td>
                  <td className="px-4 py-3.5"><Badge status={user.role} type="user" /></td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleOpenModal(user)} className="text-gray-400 hover:text-sky-500 transition-colors" title="編輯">
                        <Edit size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "編輯會員" : "新增會員"} placement="top">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-inner tracking-wider text-[13px] md:text-[15px]" placeholder="姓名" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <input maxLength="5" pattern="\d{5}" className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-inner tracking-wider text-[13px] md:text-[15px]" placeholder="手機末五碼" value={formData.phoneLast5} onChange={e => setFormData({...formData, phoneLast5: e.target.value})} />
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-400 mb-1 tracking-widest">權限</label>
            <select className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none appearance-none cursor-pointer shadow-inner tracking-wider text-[13px] md:text-[15px]" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
              <option value="user" className="bg-gray-900">一般使用者</option>
              <option value="admin" className="bg-gray-900">管理員</option>
            </select>
          </div>
          <Button type="submit" className="w-full justify-center rounded-full py-3 mt-4 text-[14px] md:text-[15px] transform active:scale-[0.97] active:bg-sky-500 active:text-white active:shadow-[0_0_14px_rgba(14,165,233,0.22)] transition-all duration-150">{editingUser ? "儲存變更" : "新增"}</Button>
        </form>
      </Modal>
    </div>
  );
};

const ReservationCard = ({ res, isAdmin, onUpdateStatus }) => {
  const firstItem = res.items[0] || {};
  const timePeriod = `${firstItem.startDate || ''} ${firstItem.startTime || '00:00'} ~ ${firstItem.endDate || ''} ${firstItem.endTime || '23:59'}`;
  const itemsStr = res.items.map(i => `${i.name} x${i.borrowQty || 1}`).join('、');

  return (
    <div className="bg-white/5 backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-glass border border-white/10 transition-all hover:border-sky-500/[0.24] hover:bg-white/10 hover:shadow-[0_0_18px_rgba(125,168,201,0.08)] mb-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4 border-b border-white/10 pb-4">
         <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[15px] md:text-[17px] text-sky-500 tracking-wider whitespace-nowrap">{res.id}</span>
            <span className="text-gray-200 font-medium flex items-center gap-1 bg-black/40 px-2 py-1 rounded-md border border-white/10 tracking-widest text-xs md:text-sm whitespace-nowrap"><User size={14} className="text-gray-400"/>{res.userName}</span>
            <Badge status={res.status} type="res" />
         </div>
         <div className="text-xs md:text-sm text-gray-400 font-mono tracking-wider whitespace-nowrap">申請日：{res.submitDate}</div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center gap-4 text-[11px] md:text-sm bg-black/20 p-3 md:p-3 rounded-xl border border-white/5 mb-4 shadow-inner">
        <div className="text-gray-300 font-mono flex items-center gap-2 shrink-0 tracking-wider whitespace-nowrap">
          <Calendar size={16} className="text-sky-500"/>
          {timePeriod}
        </div>
        <div className="hidden md:block text-gray-600">|</div>
        <div className="font-medium flex items-center gap-2 text-gray-200 break-all leading-relaxed tracking-wider">
          <Package size={16} className="text-sky-500/70 shrink-0"/>
          {itemsStr}
        </div>
      </div>

      {isAdmin && res.status !== '已歸還' && res.status !== '已退回' && (
        <div className="flex flex-row flex-wrap sm:flex-nowrap justify-end gap-2 pt-3">
          {res.status === '審核中' && (
            <>
              <Button variant="danger" onClick={() => onUpdateStatus(res.id, '已退回')} className="press-reveal-btn press-danger rounded-full py-2.5 px-5 w-auto transition-all duration-150">退回申請</Button>
              <Button variant="success" onClick={() => onUpdateStatus(res.id, '已借出')} className="press-reveal-btn press-success rounded-full py-2.5 px-5 w-auto transition-all duration-150">核准借出</Button>
            </>
          )}
          {res.status === '已借出' && (
            <Button variant="primary" onClick={() => onUpdateStatus(res.id, '已歸還')} className="press-reveal-btn press-primary rounded-full py-2.5 px-5 w-auto transition-all duration-150">確認歸還</Button>
          )}
        </div>
      )}
    </div>
  );
};

const AdminReservations = ({ reservations = [], onUpdateStatus }) => {
  const visibleRes = reservations.filter(r => r.status !== '已歸還');

  return (
    <div className="space-y-6">
      <div className="content-reveal space-y-4 relative z-10">
        {visibleRes.map(res => (
          <ReservationCard key={res.id} res={res} isAdmin={true} onUpdateStatus={onUpdateStatus} />
        ))}
        {visibleRes.length === 0 && (
          <div className="text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl py-16 shadow-glass px-4">
            <CheckCircle className="mx-auto text-[#b1c8be]/80 mb-4 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" size={56} />
            <p className="text-[15px] md:text-[17px] text-gray-300 font-bold tracking-wider whitespace-nowrap">目前沒有需要處理的預約單，太棒了！</p>
          </div>
        )}
      </div>
    </div>
  );
};

const UserCart = ({ cart = [], onRemoveFromCart, onUpdateCartItem, onSubmitReservation }) => (
  <div className="max-w-4xl mx-auto space-y-6">
    {cart.length === 0 ? (
      <div className="text-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl py-16 shadow-glass relative z-10 px-4">
        <p className="text-[15px] md:text-[17px] text-gray-300 font-bold tracking-wider whitespace-nowrap">預約單是空的，快去器材庫逛逛吧！</p>
      </div>
    ) : (
      <div className="space-y-4 relative z-10">
        {cart.map((item, index) => (
          <div key={index} className="bg-white/5 backdrop-blur-xl p-4 md:p-5 rounded-3xl shadow-glass border border-white/10 transition-all hover:border-sky-500/[0.24] hover:bg-white/10 hover:shadow-[0_0_18px_rgba(125,168,201,0.08)] mb-4">
            
            <div className="flex justify-between items-center mb-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[15px] md:text-[17px] text-sky-500 tracking-wider truncate max-w-[200px] md:max-w-[400px]">{item.name}</span>
              </div>
              <button onClick={() => onRemoveFromCart(index)} className="text-gray-500 hover:text-[#eadce2] p-1.5 hover:bg-white/[0.05] rounded-xl transition-all border border-transparent hover:border-white/10">
                <Trash2 size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-[11px] md:text-sm bg-black/20 p-3 rounded-xl border border-white/5 shadow-inner">
              <div className="flex items-center gap-2 text-gray-300 font-medium whitespace-nowrap overflow-x-auto pb-1">
                <Package size={16} className="text-sky-500 shrink-0"/>
                <span className="shrink-0">數量</span>
                <select className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 outline-none focus:border-sky-500 text-white text-center min-w-[68px]" value={item.borrowQty} onChange={(e) => onUpdateCartItem(index, 'borrowQty', parseInt(e.target.value) || 1)}>
                  {Array.from({ length: item.maxQty }, (_, i) => i + 1).map(q => <option key={q} value={q} className="bg-gray-900">{q} / {item.maxQty}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 text-gray-200 whitespace-nowrap overflow-x-auto pb-1">
                <Calendar size={16} className="text-sky-500 shrink-0"/>
                <span className="text-gray-500 shrink-0">起</span>
                <input type="date" className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-sky-500 text-[12px] w-[8.4rem] shrink-0" value={item.startDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => onUpdateCartItem(index, 'startDate', e.target.value)} />
                <select className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-sky-500 text-[12px] w-[5.8rem] shrink-0" value={item.startTime} onChange={(e) => onUpdateCartItem(index, 'startTime', e.target.value)}>
                  {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map(time => <option key={time} value={time} className="bg-gray-900">{time}</option>)}
                </select>
                <span className="text-gray-600 shrink-0">—</span>
                <span className="text-gray-500 shrink-0">迄</span>
                <input type="date" className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-sky-500 text-[12px] w-[8.4rem] shrink-0" value={item.endDate} min={item.startDate} onChange={(e) => onUpdateCartItem(index, 'endDate', e.target.value)} />
                <select className="bg-black/40 border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-sky-500 text-[12px] w-[5.8rem] shrink-0" value={item.endTime} onChange={(e) => onUpdateCartItem(index, 'endTime', e.target.value)}>
                  {Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`).map(time => <option key={time} value={time} className="bg-gray-900">{time}</option>)}
                </select>
              </div>
            </div>

          </div>
        ))}
        
        <div className="flex justify-end pt-4">
          <Button onClick={onSubmitReservation} className="rounded-full shadow-btn px-6 md:px-8 py-3 font-semibold tracking-wider w-full md:w-auto text-[14px] md:text-[15px] transform active:scale-[0.97] active:bg-sky-500 active:text-white active:shadow-[0_0_14px_rgba(14,165,233,0.22)] transition-all duration-150">
            送出預約申請
          </Button>
        </div>
      </div>
    )}
  </div>
);

const AdminItems = ({ items = [], itemTypes = [], onAddItem, reservations = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchInputRef = useRef(null);
  const filterSelectRef = useRef(null);
  const [newItem, setNewItem] = useState({ name: '', type: itemTypes[0] || '其他', accessories: '', lifespan: '', id: '', qty: 1 });

  const openSearchMorph = () => {
    setIsSearchOpen(true);
    requestAnimationFrame(() => searchInputRef.current?.focus());
  };

  const closeSearchMorph = () => {
    if (!searchTerm.trim()) setIsSearchOpen(false);
  };

  const openFilterMorph = () => {
    setIsFilterOpen(true);
    requestAnimationFrame(() => {
      const el = filterSelectRef.current;
      if (!el) return;
      el.focus();
      try { el.showPicker?.(); } catch (e) {}
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddItem(newItem);
    setIsModalOpen(false);
    setNewItem({ name: '', type: itemTypes[0] || '其他', accessories: '', lifespan: '', id: '', qty: 1 });
  };

  const filteredItems = items.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="search-fade fixed left-0 right-0 z-40 bg-[#05050A]/78 backdrop-blur-2xl border-b border-white/10 px-4 md:px-8 py-3 transition-opacity shadow-[0_10px_30px_rgba(0,0,0,0.7)]" style={{top: "64px"}}>
        <div className="max-w-7xl mx-auto toolbar-shell">
          <div className="toolbar-leading">
            <div className={`toolbar-morph ${isFilterOpen ? 'is-open' : ''}`}>
              <button type="button" className="toolbar-morph-btn" onMouseDown={openFilterMorph} onTouchStart={openFilterMorph} onClick={openFilterMorph} aria-label="展開類型選單">
                <Filter size={18} />
              </button>
              <select className="toolbar-morph-field toolbar-morph-select" value={filterType} onChange={(e) => setFilterType(e.target.value)} onBlur={() => setIsFilterOpen(false)}>
                <option value="all">所有類型</option>
                {itemTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className={`toolbar-morph ${isSearchOpen ? 'is-open' : ''}`}>
              <button type="button" className="toolbar-morph-btn" onMouseDown={openSearchMorph} onTouchStart={openSearchMorph} onClick={openSearchMorph} aria-label="展開搜尋欄">
                <Search size={18} />
              </button>
              <input
                ref={searchInputRef}
                className="toolbar-morph-field toolbar-morph-input"
                placeholder="搜尋器材名稱..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onBlur={closeSearchMorph}
              />
            </div>
            <Button onClick={() => setIsModalOpen(true)} title="新增器材" aria-label="新增器材" className="circle-add-btn shrink-0 transition-all duration-150"><Plus size={18}/></Button>
          </div>
        </div>
      </div>

      <div className="content-reveal mt-6 bg-white/5 backdrop-blur-xl rounded-2xl shadow-glass border border-white/10 overflow-hidden relative z-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap tracking-wider text-[13px] md:text-[15px]">
            <thead className="bg-black/40 border-b border-white/10 text-gray-300">
              <tr><th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">名稱</th><th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">類型</th><th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">數量 (剩餘/總數)</th><th className="px-4 py-3.5 font-semibold text-[12px] md:text-[14px]">當前狀態</th></tr>
            </thead>
            <tbody className="text-gray-200">
              {filteredItems.map(item => {
                const itemReservations = reservations
                  .filter(r => r.status === '已借出')
                  .flatMap(r => r.items.filter(i => i.itemId === item.id || i.name === item.name));

                const now = new Date();
                const currentlyUsedQty = itemReservations.filter(i => {
                    const start = new Date(`${i.startDate}T${i.startTime || '00:00'}`);
                    const effectiveStart = new Date(start.getTime() - 2 * 60 * 60 * 1000);
                    const end = new Date(`${i.endDate}T${i.endTime || '23:59'}`);
                    return now >= effectiveStart && now <= end;
                  }).reduce((sum, i) => sum + (i.borrowQty || 1), 0);

                const currentRemainingQty = item.qty - currentlyUsedQty;
                const isOutOfStock = currentRemainingQty <= 0;
                let displayStatus = item.status;
                if (displayStatus !== 'maintenance' && displayStatus !== 'inquire') { displayStatus = isOutOfStock ? 'borrowed' : 'available'; }

                return (
                  <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-white tracking-widest">{item.name}</td>
                    <td className="px-4 py-3.5 text-gray-400">{item.type}</td>
                    <td className="px-4 py-3.5"><span className={`font-bold ${isOutOfStock ? 'text-[#c4a8b2]' : 'text-sky-500'}`}>{currentRemainingQty > 0 ? currentRemainingQty : 0}</span><span className="text-gray-500 text-xs font-mono"> / {item.qty}</span></td>
                    <td className="px-4 py-3.5"><Badge status={displayStatus} /></td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && <tr><td colSpan="4" className="p-12 text-center text-gray-400 font-bold tracking-wider">此分類目前沒有任何物件</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="新增器材" placement="top">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-inner tracking-wider text-[13px] md:text-[15px]" placeholder="名稱" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} />
          <select className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none appearance-none cursor-pointer shadow-inner tracking-wider text-[13px] md:text-[15px]" value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value})}>
            {itemTypes.map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
          </select>
          <input className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-inner tracking-wider text-[13px] md:text-[15px]" placeholder="總數量" type="number" min="1" value={newItem.qty} onChange={e => setNewItem({...newItem, qty: parseInt(e.target.value) || 1})} />
          <input className="w-full p-2.5 bg-black/40 text-white border border-white/20 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none shadow-inner tracking-wider text-[13px] md:text-[15px]" placeholder="配件 (選填)" value={newItem.accessories} onChange={e => setNewItem({...newItem, accessories: e.target.value})} />
          <Button type="submit" className="w-full justify-center rounded-full py-3 mt-4 text-[14px] md:text-[15px] transform active:scale-[0.97] active:bg-sky-500 active:text-white active:shadow-[0_0_14px_rgba(14,165,233,0.22)] transition-all duration-150">上架</Button>
        </form>
      </Modal>
    </div>
  );
};

const SpaceLightBalls = () => {
  const containerRef = useRef(null);
  const ballsRef = useRef([]);
  const domRefs = useRef([]);

  useEffect(() => {
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const lerp = (start, end, alpha) => start + (end - start) * alpha;

    const initBalls = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const isLiteMode = window.innerWidth < 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      ballsRef.current = isLiteMode ? [
        { x: w * 0.24, y: h * 0.34, vx: 0.14, vy: 0.08, radius: 18, baseRadius: 18, id: 'ball1', cls: 'flicker-1', offset: 0, speedPhase: Math.random() * 10, wanderSeed: Math.random() * 100, depth: 0.38 },
        { x: w * 0.72, y: h * 0.62, vx: -0.12, vy: 0.1, radius: 30, baseRadius: 30, id: 'ball2', cls: 'flicker-2', offset: 140, speedPhase: Math.random() * 10, wanderSeed: Math.random() * 100, depth: 0.78 }
      ] : [
        { x: w * 0.18, y: h * 0.28, vx: 0.24, vy: 0.14, radius: 15, baseRadius: 15, id: 'ball1', cls: 'flicker-1', offset: 0, speedPhase: Math.random() * 10, wanderSeed: Math.random() * 100, depth: 0.35 },
        { x: w * 0.78, y: h * 0.58, vx: -0.2, vy: 0.15, radius: 40, baseRadius: 40, id: 'ball2', cls: 'flicker-2', offset: 120, speedPhase: Math.random() * 10, wanderSeed: Math.random() * 100, depth: 0.9 },
        { x: w * 0.52, y: h * 0.76, vx: 0.16, vy: -0.22, radius: 26, baseRadius: 26, id: 'ball3', cls: 'flicker-3', offset: 240, speedPhase: Math.random() * 10, wanderSeed: Math.random() * 100, depth: 0.6 }
      ];
    };

    initBalls();

    let animationFrameId;
    let globalTime = 0;
    let lastFrameTime = 0;

    const updatePhysics = (timestamp = 0) => {
      const isLiteMode = window.innerWidth < 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (isLiteMode && timestamp - lastFrameTime < 32) {
        animationFrameId = requestAnimationFrame(updatePhysics);
        return;
      }
      lastFrameTime = timestamp;
      const balls = ballsRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;
      globalTime += isLiteMode ? 0.009 : 0.014;

      balls.forEach((b, index) => {
        b.speedPhase += 0.005 + index * 0.0014 + b.depth * 0.0018;

        const pulse = (Math.sin(b.speedPhase) + 1) * 0.5;
        const activity = lerp(0.18, 0.85, pulse);
        const depthSpeed = lerp(0.7, 1.18, b.depth);

        const swimAngle =
          Math.sin(globalTime * (0.42 + index * 0.05) * depthSpeed + b.wanderSeed) * 1.15 +
          Math.cos(globalTime * (0.27 + index * 0.03) * depthSpeed + b.offset) * 0.85;

        const impulseX = Math.cos(swimAngle + b.offset * 0.01) * (0.015 + activity * 0.02) * depthSpeed;
        const impulseY = Math.sin(swimAngle * 0.9 + b.offset * 0.01) * (0.015 + activity * 0.02) * depthSpeed;

        b.vx += impulseX;
        b.vy += impulseY;

        const centerPullX = (w * 0.5 - b.x) * 0.00018;
        const centerPullY = (h * 0.5 - b.y) * 0.00018;
        b.vx += centerPullX;
        b.vy += centerPullY;

        const edgeBuffer = Math.max(90, b.baseRadius * 3.6);
        const turnForce = lerp(0.034, 0.058, b.depth);

        const leftLimit = b.baseRadius + edgeBuffer;
        const rightLimit = w - b.baseRadius - edgeBuffer;
        const topLimit = b.baseRadius + edgeBuffer;
        const bottomLimit = h - b.baseRadius - edgeBuffer;

        if (b.x < leftLimit) { b.vx += turnForce * ((leftLimit - b.x) / edgeBuffer); } 
        else if (b.x > rightLimit) { b.vx -= turnForce * ((b.x - rightLimit) / edgeBuffer); }

        if (b.y < topLimit) { b.vy += turnForce * ((topLimit - b.y) / edgeBuffer); } 
        else if (b.y > bottomLimit) { b.vy -= turnForce * ((b.y - bottomLimit) / edgeBuffer); }

        const friction = lerp(0.987, 0.982, b.depth);
        b.vx *= friction;
        b.vy *= friction;

        const maxSpeed = lerp(0.5, 0.95, b.depth);
        b.vx = clamp(b.vx, -maxSpeed, maxSpeed);
        b.vy = clamp(b.vy, -maxSpeed, maxSpeed);

        b.x += b.vx;
        b.y += b.vy;

        b.x = clamp(b.x, b.baseRadius + 8, w - b.baseRadius - 8);
        b.y = clamp(b.y, b.baseRadius + 8, h - b.baseRadius - 8);
      });

      if (!isLiteMode) {
        for (let i = 0; i < balls.length; i++) {
          for (let j = i + 1; j < balls.length; j++) {
            const b1 = balls[i];
            const b2 = balls[j];
            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = b1.baseRadius + b2.baseRadius;

            if (dist < minDist && dist > 0) {
              const overlap = (minDist - dist) / 2;
              const nx = dx / dist;
              const ny = dy / dist;

              b1.x -= nx * overlap;
              b1.y -= ny * overlap;
              b2.x += nx * overlap;
              b2.y += ny * overlap;

              const relVelX = b1.vx - b2.vx;
              const relVelY = b1.vy - b2.vy;
              const velocityAlongNormal = relVelX * nx + relVelY * ny;
              if (velocityAlongNormal > 0) continue;

              const restitution = 0.95;
              let impulse = -(1 + restitution) * velocityAlongNormal;
              impulse /= (1 / b1.baseRadius + 1 / b2.baseRadius);

              const impulseX = impulse * nx;
              const impulseY = impulse * ny;

              b1.vx += impulseX / b1.baseRadius;
              b1.vy += impulseY / b1.baseRadius;
              b2.vx -= impulseX / b2.baseRadius;
              b2.vy -= impulseY / b2.baseRadius;
            }
          }
        }
      }

      balls.forEach((b, i) => {
        const depthScale = 1 + Math.sin(globalTime * (0.65 + b.depth * 0.18) + b.offset) * (0.018 + b.depth * 0.02);
        const depthDrift = isLiteMode ? lerp(4, 10, b.depth) : lerp(8, 22, b.depth);
        const parallaxX = Math.sin(globalTime * (0.22 + b.depth * 0.08) + b.wanderSeed) * depthDrift;
        const parallaxY = Math.cos(globalTime * (0.18 + b.depth * 0.06) + b.offset) * (depthDrift * 0.7);

        if (domRefs.current[i]) {
          domRefs.current[i].style.transform = `translate(${b.x - b.baseRadius + parallaxX}px, ${b.y - b.baseRadius + parallaxY}px) scale(${depthScale})`;
        }
      });

      animationFrameId = requestAnimationFrame(updatePhysics);
    };

    const handleResize = () => {
      cancelAnimationFrame(animationFrameId);
      initBalls();
      animationFrameId = requestAnimationFrame(updatePhysics);
    };

    animationFrameId = requestAnimationFrame(updatePhysics);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" ref={containerRef}>
      {ballsRef.current.map((ball, i) => (
        <div
          key={ball.id}
          ref={el => domRefs.current[i] = el}
          style={{ position: 'absolute', top: 0, left: 0, width: `${ball.baseRadius * 2}px`, height: `${ball.baseRadius * 2}px`, willChange: 'transform' }}
        >
          <div className={`w-full h-full space-light-ball ${ball.cls}`} />
        </div>
      ))}
    </div>
  );
};


// === 根元件 App ===
export default function App() {
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true); 
  
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const [activeTab, setActiveTab] = useState(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        return user.role === 'admin' ? 'admin_dashboard' : 'items';
      } catch (e) {
        return 'items';
      }
    }
    return 'items';
  }); 

  const [isSimulatingUser, setIsSimulatingUser] = useState(false);
  const [cart, setCart] = useState([]);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [cartAnimObj, setCartAnimObj] = useState(null);

  const [dialog, setDialog] = useState({ isOpen: false, type: 'alert', message: '', onConfirm: null });
  const [pageTransitionKey, setPageTransitionKey] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const showAlert = useCallback((message) => setDialog({ isOpen: true, type: 'alert', message, onConfirm: null }), []);
  const showConfirm = useCallback((message, onConfirm) => setDialog({ isOpen: true, type: 'confirm', message, onConfirm }), []);
  const closeDialog = useCallback(() => setDialog(prev => ({ ...prev, isOpen: false })), []);

  useEffect(() => { setPageTransitionKey(k => k + 1); }, [activeTab]);

  useEffect(() => {
    const handlePointerDown = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setIsUserMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  // 登入超時檢查機制
  useEffect(() => {
    if (!currentUser) return;
    const INACTIVITY_LIMIT_MS = 60 * 60 * 1000;
    const handleInactivityLogout = () => {
      setCurrentUser(null); localStorage.removeItem('currentUser'); localStorage.removeItem('lastActivity');
      setIsSimulatingUser(false); setCart([]); setActiveTab('dashboard');
      showAlert("因您已閒置超過 60 分鐘，系統已為您自動登出保護帳號安全。");
    };

    const checkInactivity = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity && Date.now() - parseInt(lastActivity, 10) > INACTIVITY_LIMIT_MS) handleInactivityLogout();
    };

    const updateActivity = () => localStorage.setItem('lastActivity', Date.now().toString());

    checkInactivity(); updateActivity();
    window.addEventListener('mousemove', updateActivity); window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity); window.addEventListener('scroll', updateActivity);

    const intervalId = setInterval(checkInactivity, 60000);
    return () => {
      window.removeEventListener('mousemove', updateActivity); window.removeEventListener('keydown', updateActivity);
      window.removeEventListener('click', updateActivity); window.removeEventListener('scroll', updateActivity);
      clearInterval(intervalId);
    };
  }, [currentUser, showAlert]);

  // 載入資料 (透過 API)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await api.getInventory();
        setItems(data.items || []);
        setItemTypes(data.types || []);
        setUsers(data.users || []);
        setReservations(data.reservations || []);
      } catch (error) {
        console.error("載入資料失敗:", error);
        showAlert("無法連接到伺服器載入資料，請稍後再試。");
      }
      setIsLoading(false);
    };
    loadData();
  }, [showAlert]);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin' && activeTab.startsWith('admin_')) setActiveTab('dashboard');
  }, [currentUser, activeTab]);

  useEffect(() => { setIsUserMenuOpen(false); }, [activeTab, currentUser, isSimulatingUser]);

  const handleLogin = (phoneLast5) => {
    if (!phoneLast5) return setAuthError('請輸入末五碼');
    const matchedUsers = users.filter(u => u.phoneLast5 === phoneLast5);
    if (matchedUsers.length === 1) {
      const user = matchedUsers[0];
      if (user.status === 'pending') return setAuthError('帳號審核中');
      setCurrentUser(user);
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('lastActivity', Date.now().toString()); 
      setIsSimulatingUser(false);
      setActiveTab(user.role === 'admin' ? 'admin_dashboard' : 'items');
    } else if (matchedUsers.length > 1) setAuthError('有多位使用者使用相同密碼，請聯繫管理員');
    else setAuthError('找不到此代碼的帳號');
  };

  const handleLogout = () => { 
    setCurrentUser(null); localStorage.removeItem('currentUser'); localStorage.removeItem('lastActivity'); 
    setIsSimulatingUser(false); setCart([]); setActiveTab('dashboard'); 
  };

  const handleRegister = async (form) => {
    if (users.some(u => u.phoneLast5 === form.phoneLast5)) { setAuthError('此手機末五碼已被註冊'); return false; }
    const newUser = { ...form, id: 'U_' + form.phoneLast5 + '_new', role: 'user', status: 'pending' };
    
    try {
      await api.addUser(newUser);
      setUsers(prev => [...prev, newUser]);
      setAuthSuccess('申請成功！請等待審核');
      return true;
    } catch (e) {
      setAuthError('註冊失敗，請重試');
      return false;
    }
  };

  const handleUpdateUser = (updatedUser) => {
    const isDuplicate = users.some(u => u.id !== updatedUser.id && u.phoneLast5 === updatedUser.phoneLast5);
    if (isDuplicate) return showAlert('手機末五碼重複！更新失敗');
    // 若有需要，可以擴充 update API
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    showAlert('會員資料已更新');
  };

  const handleAddUser = async (newUserForm) => {
    if (users.some(u => u.phoneLast5 === newUserForm.phoneLast5)) return showAlert('手機末五碼重複！新增失敗');
    const newUser = { ...newUserForm, id: 'U_' + newUserForm.phoneLast5 + '_new', status: 'active' };
    try {
      await api.addUser(newUser);
      setUsers(prev => [...prev, newUser]);
      showAlert('會員已新增');
    } catch (e) {
      showAlert('新增失敗');
    }
  };

  const handleUpdateResStatus = async (resId, status) => {
    if (status === '已借出') {
      const targetRes = reservations.find(r => r.id === resId);
      if (!targetRes) return;
      const approvedRes = reservations.filter(r => r.status === '已借出' && r.id !== resId);
      
      for (const reqItem of targetRes.items) {
        const itemTotalQty = items.find(i => i.id === reqItem.itemId || i.name === reqItem.name)?.qty || 1;
        let overlappingQty = 0;

        approvedRes.forEach(ar => {
          ar.items.forEach(ai => {
            if ((ai.itemId === reqItem.itemId || ai.name === reqItem.name) && isDateOverlap(reqItem.startDate, reqItem.startTime, reqItem.endDate, reqItem.endTime, ai.startDate, ai.startTime, ai.endDate, ai.endTime)) {
              overlappingQty += (ai.borrowQty || 1);
            }
          });
        });

        if (overlappingQty + (reqItem.borrowQty || 1) > itemTotalQty) {
          showAlert(`核准失敗！數量不足。\n\n物件：${reqItem.name}\n衝突時段內已出借：${overlappingQty}件\n欲借：${reqItem.borrowQty || 1}件\n總庫存僅有：${itemTotalQty}件。`);
          return false;
        }
      }
    }
    
    try {
      await api.updateStatus(resId, status);
      setReservations(reservations.map(r => r.id === resId ? { ...r, status } : r));
      return true;
    } catch (e) {
      showAlert('更新狀態失敗');
      return false;
    }
  };

  const toggleSimulation = () => { 
    if (!currentUser || currentUser.role !== 'admin') return; 
    setIsSimulatingUser(!isSimulatingUser); 
    setActiveTab(!isSimulatingUser ? 'items' : 'admin_dashboard'); 
  };
  
  const normalizeHourTime = (value) => {
    if (!value) return '00:00';
    const [hour = '00'] = value.split(':');
    return `${String(hour).padStart(2, '0')}:00`;
  };

  const addToCart = (item) => { 
    if (cart.find(c => c.id === item.id)) return showAlert('已在預約單中，請勿重複加入！'); 
    const now = new Date(); const nextHour = new Date(now); nextHour.setHours(now.getHours() + 1); nextHour.setMinutes(0); nextHour.setSeconds(0); nextHour.setMilliseconds(0);
    const startD = `${nextHour.getFullYear()}-${String(nextHour.getMonth() + 1).padStart(2, '0')}-${String(nextHour.getDate()).padStart(2, '0')}`;
    const startT = `${String(nextHour.getHours()).padStart(2, '0')}:00`;
    const endNextHour = new Date(nextHour.getTime() + 60 * 60 * 1000);
    const endD = `${endNextHour.getFullYear()}-${String(endNextHour.getMonth() + 1).padStart(2, '0')}-${String(endNextHour.getDate()).padStart(2, '0')}`;
    const endT = `${String(endNextHour.getHours()).padStart(2, '0')}:00`;

    setCart([...cart, { ...item, startDate: startD, startTime: startT, endDate: endD, endTime: endT, borrowQty: 1, maxQty: item.qty }]); 
    setCartAnimObj(Date.now());
  };
  
  const updateCartItem = (i, f, v) => { 
    const c = [...cart]; 
    let newItem = { ...c[i] };
    
    if (f === 'borrowQty') { 
      if (v > newItem.maxQty) v = newItem.maxQty; 
      if (v < 1) v = 1; 
    }
    if (f === 'startTime' || f === 'endTime') v = normalizeHourTime(v);
    newItem[f] = v; 

    if (['startDate', 'startTime', 'endDate', 'endTime'].includes(f)) {
      const startDt = new Date(`${newItem.startDate}T${newItem.startTime || '00:00'}`);
      const endDt = new Date(`${newItem.endDate}T${newItem.endTime || '00:00'}`);
      
      if (startDt > endDt) {
         const newEndDt = new Date(startDt.getTime() + 60 * 60 * 1000);
         newItem.endDate = `${newEndDt.getFullYear()}-${String(newEndDt.getMonth() + 1).padStart(2, '0')}-${String(newEndDt.getDate()).padStart(2, '0')}`;
         newItem.endTime = `${String(newEndDt.getHours()).padStart(2, '0')}:00`; 
      }
    }

    c[i] = newItem; 
    setCart(c); 
  };
  
  const submitReservation = async () => { 
    if(cart.length===0) return; 
    
    const newResId = generateResId(reservations); 
    const newReservation = { 
      id: newResId, 
      userId: currentUser.id, 
      userName: currentUser.name, 
      items: cart.map(i=>({itemId:i.id, name:i.name, startDate:i.startDate, startTime:i.startTime, endDate:i.endDate, endTime:i.endTime, borrowQty: i.borrowQty})), 
      status: '審核中', 
      submitDate: new Date().toISOString().split('T')[0] 
    };
    
    try {
      await api.addReservation(newReservation);
      setReservations(prev => [...prev, newReservation]); 
      setCart([]); 
      showAlert(`預約單已送出，請等待管理員審核。\n您的預約單號為：${newResId}`); 
      setActiveTab('my_history'); 
    } catch (e) {
      showAlert('送出申請失敗');
    }
  };
  
  const addItem = async (d) => {
    const newItem = {...d, id: d.id||`IT${Date.now()}`, status: 'available'};
    try {
      await api.addItem(newItem);
      setItems(prev => [...prev, newItem]);
      showAlert('上架成功');
    } catch (e) {
      showAlert('上架失敗');
    }
  };

  const userHistoryReservations = reservations.filter(r => r.userId === currentUser?.id || r.userName === currentUser?.name);

  let pendingCount = 0;
  if (currentUser) {
    if (currentUser.role === 'admin' && !isSimulatingUser) {
      pendingCount = reservations.filter(r => r.status === '審核中').length;
    } else {
      const pendingUserRes = reservations.filter(r => (r.userId === currentUser.id || r.userName === currentUser.name) && r.status === '審核中').length;
      pendingCount = cart.length + pendingUserRes;
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: globalCss }} />
      <SpaceLightBalls />
      <Dialog dialog={dialog} closeDialog={closeDialog} />

      {isLoading ? (
        <div className="min-h-[100dvh] bg-transparent flex items-center justify-center relative z-10">
          <div className="flex flex-col items-center gap-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]">
            <div className="w-24 h-24 md:w-32 md:h-32 animate-bounce">
              <img src={LOGO_ICON_URL} alt="Loading" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      ) : !currentUser ? (
        <div className="relative z-10">
          <LoginScreen onLogin={handleLogin} onRegister={handleRegister} authError={authError} authSuccess={authSuccess} clearAuthMsg={() => { setAuthError(''); setAuthSuccess(''); }} />
        </div>
      ) : (
        <div className="min-h-[100dvh] bg-transparent flex flex-col font-tc2 text-gray-200 overflow-x-hidden relative z-10">
          
          {isSimulatingUser && <div className="bg-sky-500/[0.72] backdrop-blur-md text-white border-b border-sky-500 text-center font-bold flex justify-center items-center gap-4 fixed top-0 left-0 right-0 h-[40px] z-[60] shadow-[0_4px_15px_rgba(14,165,233,0.3)]"><Eye size={20} /><span className="tracking-widest text-[13px] md:text-[15px] whitespace-nowrap">模擬會員視角中</span><button onClick={toggleSimulation} className="bg-gray-900/80 text-sky-500 hover:text-white px-3 py-1 rounded border border-gray-600 hover:border-white transition-colors text-xs tracking-wider whitespace-nowrap">退出模擬</button></div>}

          <header className={`fixed ${isSimulatingUser ? 'top-[40px]' : 'top-0'} left-0 right-0 z-50 bg-[#05050A]/84 backdrop-blur-lg border-b border-white/10 shadow-[0_2px_20px_rgba(0,0,0,0.8)] h-[64px] flex items-center justify-between px-4 md:px-6 transition-all`}>
            <div className="flex items-center gap-3 md:gap-6 h-full w-full max-w-full overflow-hidden">
              <div 
                className="flex items-center cursor-pointer hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-all shrink-0" 
                onClick={() => {
                  if (currentUser?.role === 'admin' && !isSimulatingUser) {
                    setActiveTab('admin_dashboard');
                  } else {
                    setActiveTab('items');
                  }
                }}
              >
                <img src={LOGO_FULL_URL} alt="Logo" className="h-10 md:h-12 w-auto shrink-0 object-contain drop-shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
              </div>
            </div>

            {currentUser && (
              <div className="flex items-center gap-4 h-full shrink-0 relative">
                <div ref={userMenuRef} className="relative h-full flex items-center">
                  
                  <button type="button" onClick={() => setIsUserMenuOpen(v => !v)} className="flex items-center gap-2 md:gap-3 bg-white/[0.07] px-3 md:px-4 py-1.5 rounded-full border border-white/10 shadow-inner cursor-pointer hover:bg-white/10 transition-all relative">
                    {pendingCount > 0 && (
                      <span 
                        key={cartAnimObj} 
                        className={`absolute -top-1.5 -right-1 bg-[#5b4f55]/72 text-[#f3ecef] text-[10px] md:text-[11px] min-w-[18px] md:min-w-[20px] h-4 md:h-5 px-1 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(120,102,110,0.18)] font-bold z-20 border border-[#05050A] ${cartAnimObj ? 'animate-[popBadge_0.5s_ease-out]' : ''}`}
                      >
                        {pendingCount}
                      </span>
                    )}
                    <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-sky-500/[0.42] text-[#edf7ff] flex items-center justify-center font-bold font-tc1 text-xs md:text-sm shadow-[0_0_10px_rgba(125,168,201,0.18)] shrink-0">
                      {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                    </div>
                    <span className="font-bold font-tc1 text-gray-200 text-xs md:text-sm tracking-widest md:tracking-wider whitespace-nowrap max-w-[80px] md:max-w-[150px] truncate">{currentUser?.name || 'User'}</span>
                    <svg className={`w-3 h-3 md:w-4 md:h-4 text-gray-400 transition-transform shrink-0 ${isUserMenuOpen ? 'rotate-180 text-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  
                  <div className={`absolute top-[50px] right-0 w-48 md:w-52 transition-all duration-300 transform origin-top z-50 ${isUserMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2 pointer-events-none'}`}>
                    <div className="bg-[#05050A]/95 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] rounded-3xl overflow-hidden py-2 flex flex-col gap-1 px-2 mt-2">
                      
                      {(!currentUser || currentUser.role !== 'admin' || isSimulatingUser) ? (
                        <>
                          <button onClick={() => setActiveTab('items')} className={`px-4 py-3 text-left font-tc1 font-bold text-xs md:text-sm tracking-widest md:tracking-wider rounded-full transition-all whitespace-nowrap ${activeTab === 'items' ? 'bg-sky-500/10 text-[#c9ebff]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
                            器材列表
                          </button>
                          <button onClick={() => setActiveTab('cart')} className={`px-4 py-3 text-left font-tc1 font-bold text-xs md:text-sm tracking-widest md:tracking-wider rounded-full transition-all flex justify-between items-center whitespace-nowrap ${activeTab === 'cart' ? 'bg-sky-500/10 text-[#c9ebff]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
                            預約申請
                            {(cart && cart.length > 0) && <span key={cartAnimObj} className={`bg-[#5b4f55]/72 text-[#f3ecef] text-[10px] md:text-xs px-2 py-0.5 rounded-full shadow-btn ${cartAnimObj ? 'animate-[popBadge_0.5s_ease-out]' : ''}`}>{cart.length}</span>}
                          </button>
                          <button onClick={() => setActiveTab('my_history')} className={`px-4 py-3 text-left font-tc1 font-bold text-xs md:text-sm tracking-widest md:tracking-wider rounded-full transition-all flex justify-between items-center whitespace-nowrap ${activeTab === 'my_history' ? 'bg-sky-500/10 text-[#c9ebff]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
                            我的紀錄
                            {(userHistoryReservations.filter(r => r.status === '審核中').length > 0) && <span className="bg-[#5b4f55]/72 text-[#f3ecef] text-[10px] md:text-xs px-2 py-0.5 rounded-full shadow-btn">{userHistoryReservations.filter(r => r.status === '審核中').length}</span>}
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setActiveTab('admin_dashboard')} className={`px-4 py-3 text-left font-tc1 font-bold text-xs md:text-sm tracking-widest md:tracking-wider rounded-full transition-all whitespace-nowrap ${activeTab === 'admin_dashboard' ? 'bg-sky-500/10 text-[#c9ebff]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>數據統計</button>
                          <button onClick={() => setActiveTab('admin_res')} className={`px-4 py-3 text-left font-tc1 font-bold text-xs md:text-sm tracking-widest md:tracking-wider rounded-full transition-all flex justify-between items-center whitespace-nowrap ${activeTab === 'admin_res' ? 'bg-sky-500/10 text-[#c9ebff]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
                            預約管理
                            {(reservations.filter(r => r.status === '審核中').length > 0) && <span className="bg-[#5b4f55]/72 text-[#f3ecef] text-[10px] md:text-xs px-2 py-0.5 rounded-full shadow-btn">{reservations.filter(r => r.status === '審核中').length}</span>}
                          </button>
                          <button onClick={() => setActiveTab('admin_items')} className={`px-4 py-3 text-left font-tc1 font-bold text-xs md:text-sm tracking-widest md:tracking-wider rounded-full transition-all whitespace-nowrap ${activeTab === 'admin_items' ? 'bg-sky-500/10 text-[#c9ebff]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>器材管理</button>
                          <button onClick={() => setActiveTab('admin_users')} className={`px-4 py-3 text-left font-tc1 font-bold text-xs md:text-sm tracking-widest md:tracking-wider rounded-full transition-all whitespace-nowrap ${activeTab === 'admin_users' ? 'bg-sky-500/10 text-[#c9ebff]' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>會員管理</button>
                        </>
                      )}
                      
                      <div className="h-px bg-white/10 my-1 mx-2"></div>
                      <button onClick={handleLogout} className="px-4 py-3 text-left font-tc1 font-bold text-xs md:text-sm tracking-widest md:tracking-wider rounded-full transition-all hover:bg-white/[0.06] text-[#eadce2] flex items-center gap-2 whitespace-nowrap">
                        <LogOut size={16} /> 登出
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </header>

          <main className={`flex-1 overflow-auto ${isSimulatingUser ? 'pt-[168px]' : 'pt-32'} pb-12 px-4 md:px-8 max-w-7xl mx-auto w-full z-0 relative`}>
            <div key={`${activeTab}-${pageTransitionKey}`} className="page-reveal">
              {activeTab === 'dashboard' && <UserDashboard items={items} itemTypes={itemTypes} reservations={reservations} onAddToCart={addToCart} isSimulatingUser={isSimulatingUser} currentUser={currentUser} />}
              {activeTab === 'items' && <UserDashboard items={items} itemTypes={itemTypes} reservations={reservations} onAddToCart={addToCart} isSimulatingUser={isSimulatingUser} currentUser={currentUser} />}
              
              {activeTab === 'cart' && <UserCart cart={cart} onRemoveFromCart={(idx) => setCart(cart.filter((_, i) => i !== idx))} onUpdateCartItem={updateCartItem} onSubmitReservation={submitReservation} />}
              
              {activeTab === 'my_history' && (
                <div className="space-y-6">
                  <div className="space-y-4 relative z-10">
                    {(userHistoryReservations && userHistoryReservations.length === 0) ? (
                      <p className="text-gray-400 bg-white/5 backdrop-blur-xl p-12 text-center rounded-3xl border border-white/10 shadow-glass font-bold tracking-wider text-[13px] md:text-[15px] whitespace-nowrap">尚無預約紀錄</p>
                    ) : (
                      userHistoryReservations?.map(r => (
                        <ReservationCard key={r.id} res={r} isAdmin={false} />
                      ))
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'admin_res' && <AdminReservations reservations={reservations} onUpdateStatus={handleUpdateResStatus} />}
              {activeTab === 'admin_dashboard' && <AdminDashboard items={items} users={users} reservations={reservations} />}
              {activeTab === 'admin_items' && <AdminItems items={items} itemTypes={itemTypes} onAddItem={addItem} reservations={reservations} />}
              {activeTab === 'admin_users' && <AdminUsers users={users} onUpdateUser={handleUpdateUser} onAddUser={handleAddUser} showAlert={showAlert} />}
            </div>
          </main>
          
        </div>
      )}
    </>
  );
}