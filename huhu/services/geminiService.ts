import { GoogleGenAI, Type } from "@google/genai";
import type { Coordinates, PointOfInterest } from '../types';

const apiKey = import.meta.env.VITE_API_KEY || "AIzaSyB28eLLX9xXBUCnhSU52B00QnskYinQJcg";

const ai = new GoogleGenAI({ apiKey });
console.log('API Key exists:', !!apiKey); 

const locationSchema = {
  type: Type.OBJECT,
  properties: {
    lat: { type: Type.NUMBER, description: 'Vĩ độ của địa điểm' },
    lng: { type: Type.NUMBER, description: 'Kinh độ của địa điểm' },
  },
  required: ['lat', 'lng'],
};

const poiSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Tên của địa điểm ưa thích.' },
      description: { type: Type.STRING, description: 'Mô tả ngắn gọn trong một câu.' },
      coordinates: {
        type: Type.OBJECT,
        properties: {
          lat: { type: Type.NUMBER },
          lng: { type: Type.NUMBER }
        },
        required: ['lat', 'lng']
      }
    },
    required: ['name', 'description', 'coordinates']
  }
};

export async function getCoordinatesForLocation(locationName: string): Promise<Coordinates> {
  const prompt = `Cung cấp tọa độ địa lý (vĩ độ và kinh độ) cho địa điểm: "${locationName}, Việt Nam". Vui lòng chỉ trả về một đối tượng JSON với các khóa "lat" và "lng".`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: locationSchema,
      },
    });

    const rawText = response.text.trim();
    if (!rawText) {
        throw new Error("Mô hình AI đã trả về một phản hồi trống.");
    }
    
    // Clean potential markdown fences
    const jsonText = rawText.replace(/^```json\s*|```$/g, '').trim();

    let result: any;
    try {
      result = JSON.parse(jsonText);
    } catch (e) {
      console.error("Failed to parse coordinates JSON:", jsonText, e);
      throw new Error("Mô hình AI đã trả về phản hồi JSON không hợp lệ.");
    }

    if (typeof result !== 'object' || result === null) {
      console.error("Invalid coordinate data from API (not an object):", result);
      throw new Error("Nhận được định dạng tọa độ không hợp lệ từ mô hình AI.");
    }

    const { lat, lng } = result;

    if (
      typeof lat !== 'number' || isNaN(lat) ||
      typeof lng !== 'number' || isNaN(lng)
    ) {
      console.error("Invalid coordinate data from API (lat/lng invalid):", result);
      throw new Error("Nhận được định dạng tọa độ không hợp lệ từ mô hình AI.");
    }

    return { lat, lng };
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    if (error instanceof Error && (error.message.includes("không hợp lệ") || error.message.includes("phản hồi trống"))) {
        throw error;
    }
    
    const baseMessage = `Không thể lấy tọa độ cho ${locationName}.`;
    let details = 'Địa điểm có thể không hợp lệ hoặc đã xảy ra lỗi kết nối.';
    
    if (error instanceof Error) {
        const lowerCaseError = error.message.toLowerCase();
        if(lowerCaseError.includes("api key not valid")) {
            details = "API key không hợp lệ. Vui lòng đảm bảo biến môi trường API_KEY được đặt chính xác.";
        } else if (lowerCaseError.includes("403")) {
            details = "Lỗi xác thực (lỗi 403). Vui lòng kiểm tra API key và các quyền truy cập của nó (ví dụ: giới hạn IP hoặc referrer).";
        } else if (lowerCaseError.includes("400")) {
            details = "Yêu cầu không hợp lệ (lỗi 400). Tên địa điểm có thể không được chấp nhận.";
        } else if (lowerCaseError.includes("500")) {
            details = "Lỗi máy chủ từ dịch vụ AI (lỗi 500). Vui lòng thử lại sau.";
        } else if (lowerCaseError.includes("fetch")) {
            details = "Lỗi mạng. Vui lòng kiểm tra kết nối internet của bạn."
        }
    }
    throw new Error(`${baseMessage} ${details}`);
  }
}

export async function getPointsOfInterest(coords: Coordinates): Promise<PointOfInterest[]> {
  const prompt = `Liệt kê chính xác 5 điểm ưa thích phổ biến và thú vị gần vĩ độ ${coords.lat}, kinh độ ${coords.lng} ở Việt Nam. Cung cấp một danh sách đa dạng (ví dụ: di tích lịch sử, kỳ quan thiên nhiên, điểm văn hóa). Đối với mỗi điểm, bao gồm tên, mô tả ngắn gọn trong một câu, và vĩ độ và kinh độ chính xác của nó. Phản hồi bằng một mảng JSON gồm các đối tượng.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: poiSchema,
      },
    });
    
    const rawText = response.text.trim();
    if (!rawText) {
        console.warn("Model returned an empty response for POIs.");
        return [];
    }

    // Clean potential markdown fences
    const jsonText = rawText.replace(/^```json\s*|```$/g, '').trim();

    let results: any;
    try {
      results = JSON.parse(jsonText);
    } catch (e) {
      console.error("Failed to parse POI JSON:", jsonText, e);
      throw new Error("Mô hình AI đã trả về phản hồi JSON không hợp lệ.");
    }

    if (!Array.isArray(results)) {
      console.error("Invalid POI data from API (not an array):", results);
      throw new Error("Nhận được định dạng POI không hợp lệ từ mô hình AI (dự kiến là một mảng).");
    }

    const validPois = results.map(poi => {
      if (typeof poi !== 'object' || poi === null) {
          console.warn('Filtering out non-object item in POI array:', poi);
          return null;
      }
      const { name, description, coordinates } = poi;
      const lat = coordinates?.lat;
      const lng = coordinates?.lng;
      
      if (
        typeof name === 'string' && name.trim() !== '' &&
        typeof description === 'string' &&
        typeof lat === 'number' && !isNaN(lat) &&
        typeof lng === 'number' && !isNaN(lng)
      ) {
        return {
          name,
          description,
          coordinates: { lat, lng }
        };
      }
      console.warn('Filtering out malformed POI:', poi);
      return null;
    }).filter((poi): poi is PointOfInterest => poi !== null);

    return validPois;

  } catch (error) {
    console.error("Error fetching points of interest:", error);
    if (error instanceof Error && (error.message.includes("định dạng POI không hợp lệ") || error.message.includes("không hợp lệ"))) {
        throw error;
    }
    
    let details = 'Đã xảy ra lỗi khi truy xuất các điểm ưa thích.';
    if (error instanceof Error) {
        const lowerCaseError = error.message.toLowerCase();
        if(lowerCaseError.includes("api key not valid")) {
            details = "API key không hợp lệ. Vui lòng đảm bảo biến môi trường API_KEY được đặt chính xác.";
        } else if (lowerCaseError.includes("403")) {
            details = "Lỗi xác thực (lỗi 403). Vui lòng kiểm tra API key và các quyền truy cập của nó.";
        } else if (lowerCaseError.includes("400")) {
            details = "Yêu cầu không hợp lệ (lỗi 400).";
        } else if (lowerCaseError.includes("500")) {
            details = "Lỗi máy chủ từ dịch vụ AI (lỗi 500). Vui lòng thử lại sau.";
        } else if (lowerCaseError.includes("fetch")) {
            details = "Lỗi mạng. Vui lòng kiểm tra kết nối internet của bạn."
        }
    }
    throw new Error(details);
  }
}