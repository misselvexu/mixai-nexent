import { message } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import knowledgeBaseService from '@/services/knowledgeBaseService';
import knowledgeBasePollingService from '@/services/knowledgeBasePollingService';

// 添加类型定义
export interface AbortableError extends Error {
  name: string;
}

// 简化更新缓存的通用函数
export const updateKnowledgeBaseCache = (forceRefresh: boolean = true) => {
  knowledgeBasePollingService.triggerKnowledgeBaseListUpdate(forceRefresh);
};

// 自定义上传请求函数
export const customUploadRequest = async (
  options: any, 
  effectiveUploadUrl: string, 
  isCreatingMode: boolean,
  newKnowledgeBaseName: string,
  indexName: string,
  currentKnowledgeBaseRef: React.MutableRefObject<string>
) => {
  const { onSuccess, onError, file } = options;
  const effectiveIndexName = isCreatingMode ? newKnowledgeBaseName : indexName;
  
  // 确保是当前知识库
  if (effectiveIndexName !== currentKnowledgeBaseRef.current && !isCreatingMode) {
    onError(new Error('知识库已切换，请重新上传'));
    message.error(`文件 ${file.name} 上传失败：知识库已切换`);
    return;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('index_name', effectiveIndexName);

  try {
    const response = await fetch(effectiveUploadUrl, {
      method: 'POST',
      body: formData,
    });

    // 再次确认是当前知识库
    if (effectiveIndexName !== currentKnowledgeBaseRef.current && !isCreatingMode) {
      onError(new Error('知识库已切换，请重新上传'));
      message.error(`文件 ${file.name} 上传失败：知识库已切换`);
      return;
    }

    if (response.ok) {
      const result = await response.json();
      onSuccess(result, file);

    } else {
      onError(new Error('上传失败'));
      message.error(`文件 ${file.name} 上传失败`);
    }
  } catch (err) {
    // 确保是当前知识库的错误处理
    if (effectiveIndexName === currentKnowledgeBaseRef.current || isCreatingMode) {
      onError(new Error('上传失败'));
      message.error(`文件 ${file.name} 上传失败`);
    }
  }
};

// 检查知识库名称是否存在
export const checkKnowledgeBaseNameExists = async (
  knowledgeBaseName: string
): Promise<boolean> => {
  try {
    return await knowledgeBaseService.checkKnowledgeBaseNameExists(knowledgeBaseName);
  } catch (error) {
    console.error('检查知识库名称失败:', error);
    return false;
  }
};

// 获取知识库文档信息 - 简化版本，因为文档轮询不再需要知识库存在的前提
export const fetchKnowledgeBaseInfo = async (
  indexName: string, 
  abortController: AbortController, 
  currentKnowledgeBaseRef: React.MutableRefObject<string>,
  onSuccess: () => void,
  onError: (error: unknown) => void
) => {
  try {
    // 直接调用成功回调，因为不再需要预先检查知识库存在性
    if (!abortController.signal.aborted && indexName === currentKnowledgeBaseRef.current) {
      onSuccess();
    }
  } catch (error: unknown) {
    // 只处理非取消的错误
    const err = error as AbortableError;
    if (err.name !== 'AbortError' && indexName === currentKnowledgeBaseRef.current) {
      console.error('获取知识库信息失败:', error);
      message.error('获取知识库信息失败，请稍后重试');
      onError(error);
    }
  }
};

// 文件类型验证
export const validateFileType = (file: File): boolean => {
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/markdown',
    'text/plain',
    'text/csv',
    'application/csv'
  ];

  // 先判断 MIME type
  let isValidType = validTypes.includes(file.type);

  // 如果 MIME type 为空或不在列表里，再根据文件名后缀判断
  if (!isValidType) {
    const name = file.name.toLowerCase();
    if (
      name.endsWith('.md') ||
      name.endsWith('.markdown') ||
      name.endsWith('.csv')
    ) {
      isValidType = true;
    }
  }

  if (!isValidType) {
    message.error('只支持 PDF、Word、PPT、Excel、MD、TXT、CSV 文件格式！');
    return false;
  }

  return true;
};

// 创建模拟的文件选择事件
export const createMockFileSelectEvent = (
  file: UploadFile<any>
): React.ChangeEvent<HTMLInputElement> => {
  if (!file.originFileObj) {
    throw new Error('文件对象不存在');
  }
  
  return {
    target: {
      files: [file.originFileObj]
    },
    preventDefault: () => {},
    stopPropagation: () => {},
    nativeEvent: new Event('change'),
    currentTarget: null,
    bubbles: true,
    cancelable: true,
    defaultPrevented: false,
    eventPhase: 0,
    isTrusted: true,
    timeStamp: Date.now(),
    type: 'change'
  } as unknown as React.ChangeEvent<HTMLInputElement>;
}; 