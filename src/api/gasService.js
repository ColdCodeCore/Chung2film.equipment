const GAS_API_URL = (import.meta.env.VITE_GAS_API_URL || "").trim();
const GAS_API_TOKEN = (import.meta.env.VITE_GAS_API_TOKEN || "").trim();

const getBackendDebugContext = () => {
  if (typeof window === "undefined") {
    return { gasApiUrl: GAS_API_URL || "未設定", backendMeta: null };
  }

  return window.__ITEM_BORROWING_DEBUG__ || {
    gasApiUrl: GAS_API_URL || "未設定",
    backendMeta: null,
  };
};

const mapActionError = (action, error) => {
  const message = error?.message || "";

  if (message === "Unknown Action") {
    const debugContext = getBackendDebugContext();
    const backendVersion = debugContext?.backendMeta?.version || "未知";
    const supportedPostActions = Array.isArray(debugContext?.backendMeta?.supportedPostActions)
      ? debugContext.backendMeta.supportedPostActions.join("、")
      : "未知";

    if (action === "updateUser") {
      return new Error(
        "後端尚未支援會員更新，或目前打到的不是你剛更新的那支 Web App。\n" +
        `目前網址：${debugContext?.gasApiUrl || GAS_API_URL || "未設定"}\n` +
        `目前版本：${backendVersion}\n` +
        `支援動作：${supportedPostActions}`
      );
    }
    return new Error(
      "目前連到的後端版本較舊，或目前打到的不是你剛更新的那支 Web App。\n" +
      `目前網址：${debugContext?.gasApiUrl || GAS_API_URL || "未設定"}\n` +
      `目前版本：${backendVersion}\n` +
      `支援動作：${supportedPostActions}`
    );
  }

  return error;
};

const assertGasConfig = () => {
  if (!GAS_API_URL) {
    throw new Error("尚未設定 VITE_GAS_API_URL，請在前端環境變數填入目前使用中的 GAS Web App URL。");
  }

  if (!GAS_API_TOKEN) {
    throw new Error("尚未設定 VITE_GAS_API_TOKEN，請在前端環境變數填入 APP_API_TOKEN。");
  }
};

const parseApiResponse = async (res) => {
  if (!res.ok) {
    throw new Error(`API request failed with status ${res.status}`);
  }

  const data = await res.json();
  if (data && data.success === false) {
    throw new Error(data.error || "API request failed");
  }

  return data && data.data ? data.data : data;
};

const buildGetUrl = (action) => {
  const url = new URL(GAS_API_URL);
  url.searchParams.set("action", action);
  if (GAS_API_TOKEN) {
    url.searchParams.set("token", GAS_API_TOKEN);
  }
  return url.toString();
};

const postToGas = async (payload) => {
  try {
    const res = await fetch(GAS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        ...payload,
        ...(GAS_API_TOKEN ? { token: GAS_API_TOKEN } : {}),
      }),
    });

    return await parseApiResponse(res);
  } catch (error) {
    throw mapActionError(payload?.action, error);
  }
};

// === API 串接與本地雙軌模式服務 ===
export const api = {
  async getBackendMeta() {
    assertGasConfig();
    const res = await fetch(buildGetUrl("getMeta"));
    return await parseApiResponse(res);
  },
  async getInventory() {
    assertGasConfig();
    const res = await fetch(buildGetUrl("getInventory"));
    return await parseApiResponse(res);
  },
  async addReservation(reservation) {
    assertGasConfig();
    await postToGas({ action: 'addReservation', reservation });
  },
  async updateStatus(resId, status) {
    assertGasConfig();
    await postToGas({ action: 'updateStatus', resId, status });
  },
  async addUser(user) {
    assertGasConfig();
    return await postToGas({ action: 'addUser', user });
  },
  async updateUser(user) {
    assertGasConfig();
    return await postToGas({ action: 'updateUser', user });
  },
  async addItem(item) {
    assertGasConfig();
    return await postToGas({ action: 'addItem', item });
  },
  async addNews(news) {
    assertGasConfig();
    await postToGas({ action: 'addNews', news });
  },
  async updateNews(news) {
    assertGasConfig();
    await postToGas({ action: 'updateNews', news });
  },
  async deleteNews(newsId) {
    assertGasConfig();
    await postToGas({ action: 'deleteNews', newsId });
  }
};
