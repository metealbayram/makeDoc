import axios from "axios";

export const searchYargitay = async (req, res) => {
  try {
    const { keyword = "", page = 1, pageSize = 10 } = req.query;

    if (!keyword.trim()) {
      return res.status(400).json({
        success: false,
        message: "Aranacak kelime gerekli"
      });
    }

    const payload = {
      data: {
        aranan: keyword,
        arananKelime: keyword,
        pageSize: Number(pageSize),
        pageNumber: Number(page)
      }
    };

    const response = await axios.post(
      "https://karararama.yargitay.gov.tr/aramalist",
      payload,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Content-Type": "application/json",
          "Accept": "application/json, text/plain, */*",
          "Origin": "https://karararama.yargitay.gov.tr",
          "Referer": "https://karararama.yargitay.gov.tr/index"
        },
        timeout: 20000
      }
    );

    return res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error("Yargıtay search error:", error?.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Yargıtay araması yapılamadı",
      error: error?.response?.data || error.message
    });
  }
};

export const getYargitayDetail = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Karar id gerekli"
      });
    }

    const response = await axios.get(
      `https://karararama.yargitay.gov.tr/getDokuman?id=${id}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json, text/plain, */*",
          "Referer": "https://karararama.yargitay.gov.tr/index"
        },
        timeout: 20000
      }
    );

    return res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error("Yargıtay detail error:", error?.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Karar detayı alınamadı",
      error: error?.response?.data || error.message
    });
  }
};