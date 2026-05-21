import axios from 'axios';
import { ApiMartChatResponse, ApiMartImageTaskResponse, ApiMartImageStatusResponse, ApiMartVideoStatusResponse } from '@/types';

const APIMART_BASE_URL = 'https://api.apimart.ai/v1';

// 聊天 API - 用于分析故事
export async function chatCompletion(prompt: string, apiKey: string, model: string = 'gpt-4o'): Promise<string> {
  try {
    const response = await axios.post<ApiMartChatResponse>(
      `${APIMART_BASE_URL}/chat/completions`,
      {
        model,
        stream: false,
        max_tokens: 16000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('API Response:', JSON.stringify(response.data, null, 2));

    // Handle SSE format response (": PING\n\n{...json...}")
    let rawData = response.data as any;
    if (typeof rawData === 'string') {
      const jsonMatch = rawData.match(/\{[\s\S]*\}/);
      if (jsonMatch) rawData = JSON.parse(jsonMatch[0]);
    }

    const content = rawData?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error(`Unexpected API response format: ${JSON.stringify(rawData)}`);
    }
    return content;
  } catch (error: any) {
    console.error('Chat API error:', error);
    console.error('Error details:', error.response?.data);
    console.error('Status:', error.response?.status);
    throw new Error(`Failed to call chat API: ${error.response?.data?.error?.message || error.message}`);
  }
}

// 图像生成 API - 创建任务
export async function createImageTask(
  prompt: string,
  referenceImageUrls: string | string[],
  apiKey: string,
  model: string = 'doubao-seedream-5-0-lite',
  aspectRatio: '16:9' | '9:16' | '1:1' = '16:9'
): Promise<string> {
  try {
    const rawUrls = Array.isArray(referenceImageUrls)
      ? referenceImageUrls
      : [referenceImageUrls];

    // 将 base64 图片上传到 APIMart 获取公网 URL
    const imageUrls: string[] = [];
    for (let i = 0; i < rawUrls.length; i++) {
      const img = rawUrls[i];
      if (!img) continue;

      try {
        if (img.startsWith('data:')) {
          const url = await uploadImageToPublic(img, apiKey);
          imageUrls.push(url);
          console.log(`Image ${i + 1}/${rawUrls.length} uploaded successfully: ${url}`);
        } else {
          imageUrls.push(img);
          console.log(`Image ${i + 1}/${rawUrls.length} is already a URL: ${img}`);
        }
      } catch (error) {
        console.error(`Failed to upload image ${i + 1}/${rawUrls.length}:`, error);
        // 继续处理其他图片，不中断整个流程
      }
    }

    const requestBody: any = {
      model,
      prompt,
      size: aspectRatio,
      n: 1
    };

    if (model.includes('gpt-image')) {
      // 4k 仅支持 16:9, 9:16, 2:1, 1:2, 21:9, 9:21；1:1 等比例用 2k
      const supports4k = ['16:9', '9:16', '2:1', '1:2', '21:9', '9:21'].includes(aspectRatio);
      requestBody.resolution = supports4k ? '4k' : '2k';
    } else {
      requestBody.resolution = '2K';
    }

    if (imageUrls.length > 0 && imageUrls[0]) {
      requestBody.image_urls = imageUrls;
    }

    console.log('=== Image Generation Request ===');
    console.log('Model:', model);
    console.log('Prompt length:', prompt.length);
    console.log('Reference images:', imageUrls.length);
    console.log('Request Body:', JSON.stringify({
      ...requestBody,
      prompt: prompt.length > 500 ? prompt.substring(0, 500) + '...' : prompt,
      image_urls: imageUrls.map(url => url.substring(0, 50) + '...')
    }, null, 2));
    console.log('================================');

    const response = await axios.post(
      `${APIMART_BASE_URL}/images/generations`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data[0].task_id;
  } catch (error: any) {
    console.error('Image generation API error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    console.error('Error headers:', error.response?.headers);

    const errorMsg = error.response?.data?.error?.message || error.message;
    throw new Error(`Failed to create image generation task: ${errorMsg}`);
  }
}

// 查询任务状态
export async function getTaskStatus(taskId: string, apiKey: string): Promise<ApiMartImageStatusResponse> {
  try {
    const response = await axios.get(
      `${APIMART_BASE_URL}/tasks/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    console.log(`Task ${taskId} raw response:`, JSON.stringify(response.data, null, 2));

    // API 响应格式可能是 { code: 200, data: { task_id, status, result } }
    // 类似于 createImageTask 的响应格式
    if (response.data.data) {
      return response.data.data;
    }

    return response.data;
  } catch (error) {
    console.error('Task status API error:', error);
    throw new Error('Failed to get task status');
  }
}

// 视频生成 API - 创建任务
export async function createVideoTask(
  prompt: string,
  referenceImageUrls: string[],
  apiKey: string,
  model: string = 'sora-2',
  aspectRatio: '16:9' | '9:16' | '1:1' = '16:9',
  options?: {
    duration?: number;
    videoUrls?: string[];
    audioUrls?: string[];
    imageRoles?: Array<{ url: string; role: 'first_frame' | 'last_frame' }>;
    resolution?: '720P' | '1080P';
  }
): Promise<string> {
  try {
    console.log('=== Video Generation Debug ===');
    console.log('Model:', model);
    console.log('Model includes doubao:', model.includes('doubao'));
    console.log('Model includes seedance:', model.includes('seedance'));
    console.log('==============================');

    const requestBody: any = {
      model,
      prompt,
      duration: options?.duration ?? (model.includes('sora-2') ? 10 : 5),
    };

    const isHappyHorse = model.includes('happyhorse');
    const isOmniFlashExt = model.toLowerCase().includes('omni-flash-ext');

    // Omni-Flash-Ext 使用特殊参数格式
    if (isOmniFlashExt) {
      requestBody.aspect_ratio = aspectRatio;
      requestBody.resolution = (options?.resolution ?? '1080p').toLowerCase();
      requestBody.duration = options?.duration ?? 6;
    } else if (model.includes('wan2') || isHappyHorse) {
      // wan2.7 / HappyHorse 使用 size + resolution 参数
      requestBody.size = aspectRatio;
      requestBody.resolution = options?.resolution ?? '1080P';
    } else if (model.includes('doubao') || model.includes('seedance')) {
      // Doubao Seedance 使用 size 参数
      requestBody.size = aspectRatio;
    } else {
      requestBody.aspect_ratio = aspectRatio;
    }

    // 根据模型类型应用参考图
    if (isOmniFlashExt) {
      // Omni-Flash-Ext: 支持 0/1/3 张参考图
      if (referenceImageUrls.length > 0 && referenceImageUrls.length !== 2) {
        requestBody.image_urls = referenceImageUrls;
      }
      // 2 张图片不被支持，会返回错误
    } else if (isHappyHorse) {
      if (options?.imageRoles && options.imageRoles.length > 0) {
        const firstFrame = options.imageRoles.find(img => img.role === 'first_frame');
        const lastFrame = options.imageRoles.find(img => img.role === 'last_frame');
        if (firstFrame) requestBody.first_frame_image = firstFrame.url;
        if (lastFrame) requestBody.last_frame_image = lastFrame.url;
      } else if (referenceImageUrls.length === 1) {
        requestBody.first_frame_image = referenceImageUrls[0];
      } else if (referenceImageUrls.length > 1) {
        requestBody.image_urls = referenceImageUrls;
      }
    } else if (options?.imageRoles && options.imageRoles.length > 0) {
      // 使用自定义角色（首帧/尾帧）
      requestBody.image_with_roles = options.imageRoles;
    } else if (referenceImageUrls.length > 0) {
      // 所有模型都使用 image_urls
      requestBody.image_urls = referenceImageUrls;
    }

    // Seedance 2.0 / HappyHorse 增强功能
    if (options?.videoUrls && options.videoUrls.length > 0) {
      if (isHappyHorse && options.videoUrls.length === 1) {
        requestBody.video_url = options.videoUrls[0];
      } else {
        requestBody.video_urls = options.videoUrls;
      }
    }
    if (options?.audioUrls && options.audioUrls.length > 0 && !isHappyHorse) {
      requestBody.audio_urls = options.audioUrls;
    }

    console.log('=== Video Generation Request ===');
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    console.log('================================');

    const response = await axios.post(
      `${APIMART_BASE_URL}/videos/generations`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.data[0].task_id;
  } catch (error: any) {
    console.error('Video generation API error:', error);
    console.error('Error details:', error.response?.data);
    console.error('Status:', error.response?.status);
    throw new Error(`Failed to create video generation task: ${error.response?.data?.error?.message || error.message}`);
  }
}

// 上传 base64 图片到 APIMart 获取公网 URL
export async function uploadImageToPublic(base64Image: string, apiKey?: string): Promise<string> {
  if (!apiKey) throw new Error('API key required for image upload');
  try {
    const matches = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid base64 image format');
    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = mimeType.split('/')[1];

    const form = new FormData();
    form.append('file', new Blob([buffer], { type: mimeType }), `image.${ext}`);

    const response = await axios.post(
      `${APIMART_BASE_URL}/uploads/images`,
      form,
      { headers: { 'Authorization': `Bearer ${apiKey}` } }
    );
    return response.data.url;
  } catch (error: any) {
    console.error('Upload image error:', error.response?.data || error.message);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}


export async function getVideoTaskStatus(taskId: string, apiKey: string): Promise<ApiMartVideoStatusResponse> {
  try {
    const response = await axios.get(
      `${APIMART_BASE_URL}/tasks/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    console.log(`Video task ${taskId} raw response:`, JSON.stringify(response.data, null, 2));

    if (response.data.data) {
      return response.data.data;
    }

    return response.data;
  } catch (error) {
    console.error('Video task status API error:', error);
    throw new Error('Failed to get video task status');
  }
}
