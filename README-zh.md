# n8n-nodes-alicloud

[![English](https://img.shields.io/badge/English-Click-yellow)](README.md)
[![中文文档](https://img.shields.io/badge/中文文档-点击查看-orange)](README-zh.md)

这是一个n8n社区节点，让您可以在n8n工作流中使用阿里云的各种服务，包括智能语音服务、对象存储服务(OSS)和弹性计算服务(ECS)。

本节点支持以下阿里云服务：
- **智能语音服务**: 提供高精度的语音识别能力，支持多种音频格式的文件转录
- **对象存储服务(OSS)**: 支持文件上传、下载、列表、删除等操作
- **OSS签名URL**: 生成临时访问链接，支持多种HTTP方法和自定义参数
- **弹性计算服务(ECS)**: 管理云服务器实例

通过这个节点，您可以轻松将阿里云的各种服务集成到您的自动化工作流中。

[n8n](https://n8n.io/) 是一个[公平代码许可](https://docs.n8n.io/reference/license/)的工作流自动化平台。

[安装](#安装)  
[操作](#操作)  
[凭据](#凭据)  
[兼容性](#兼容性)  
[使用说明](#使用说明)  
[资源](#资源)  
[版本历史](#版本历史)  

## 安装

按照n8n社区节点文档中的[安装指南](https://docs.n8n.io/integrations/community-nodes/installation/)进行安装。

另外，你也可以参考使用这些[n8n工作流模板](https://github.com/crazyyanchao/n8n-workflow-template)。

## 操作

此节点支持以下资源类型和操作：

### 文件转录服务
- **文件转录（完整工作流）**: 自动处理任务提交和结果轮询的完整流程（推荐）
- **仅提交任务**: 只提交转录任务，不等待结果
- **仅查询结果**: 查询已提交任务的转录结果

### 对象存储服务 (OSS)
- **上传文件**: 将文件上传到OSS存储桶
- **下载文件**: 从OSS存储桶下载文件
- **列出对象**: 列出存储桶中的对象，支持前缀过滤和分页
- **删除对象**: 从存储桶中删除指定对象

### OSS 签名URL
- **生成签名URL**: 为OSS对象生成临时访问链接，支持多种HTTP方法

### 弹性计算服务 (ECS)
- **查询实例**: 查询ECS实例信息

## 凭据

要使用此节点，您需要：

1. **注册阿里云账户**: 访问 [阿里云官网](https://www.aliyun.com/) 注册账户
2. **开通相关服务**: 根据使用需求开通以下服务：
   - **智能语音服务**: 用于文件转录功能
   - **对象存储服务(OSS)**: 用于文件存储和管理
   - **弹性计算服务(ECS)**: 用于云服务器管理
3. **获取访问密钥**: 在RAM控制台创建AccessKey ID和AccessKey Secret
4. **获取AppKey**: 在智能语音服务控制台获取项目AppKey（仅文件转录需要）
5. **配置权限**: 确保AccessKey具有相应服务的操作权限
6. **配置凭据**: 在n8n中配置阿里云凭据

### 认证方法
- **AccessKey认证**: 使用阿里云AccessKey ID和Secret进行API调用（OSS、ECS、文件转录）
- **AppKey认证**: 使用智能语音服务项目的AppKey（仅文件转录需要）

### 权限要求
- **OSS权限**: 需要OSS的读写权限，建议使用最小权限原则
- **ECS权限**: 需要ECS的只读权限（查询实例信息）
- **智能语音权限**: 需要智能语音服务的转录权限

## 兼容性

- **最低n8n版本**: 1.0.0
- **Node.js版本**: >=22.16
- **测试版本**: n8n 1.0.0+

## 使用说明

### 基本配置

1. **添加阿里云文件转录节点**到您的工作流中
2. **配置凭据**: 选择或创建阿里云文件转录API凭据
3. **选择操作**: 选择文件转录操作类型
4. **输入文件链接**: 提供要转录的音频文件URL

### 操作类型详解

#### 1. 文件转录（完整工作流）- 推荐使用
- **功能**: 一键完成文件转录，自动处理所有内部流程
- **输入**: 文件链接
- **输出**: 完整的转录结果
- **特点**: 最简单易用，适合大多数场景

#### 2. 仅提交任务
- **功能**: 只提交转录任务，获得任务ID
- **输入**: 文件链接
- **输出**: 任务ID和提交状态
- **用途**: 批量提交任务或异步处理

#### 3. 仅查询结果
- **功能**: 查询指定任务的转录结果
- **输入**: 任务ID
- **输出**: 当前任务状态和结果
- **用途**: 配合"仅提交任务"使用

### 参数配置

#### 文件转录参数

##### 简单设置模式（推荐）
- **文件链接**: 要转录的音频文件URL
- **版本**: API版本（默认4.0）
- **启用词信息**: 是否输出词信息（默认false）
- **启用采样率自适应**: 是否启用采样率自适应（默认true）

##### 高级JSON配置模式
```json
{
  "appkey": "your_app_key",
  "file_link": "your_file_link",
  "version": "4.0",
  "enable_words": false,
  "enable_sample_rate_adaptive": true
}
```

#### OSS操作参数

##### 上传文件
- **OSS区域**: OSS区域端点（如：oss-cn-beijing）
- **存储桶名称**: 目标OSS存储桶名称
- **对象键**: 文件在存储桶中的路径（如：path/to/file.jpg）
- **二进制属性**: 上传文件的二进制属性名（默认：data）

##### 下载文件
- **OSS区域**: OSS区域端点
- **存储桶名称**: 源OSS存储桶名称
- **对象键**: 要下载的文件路径
- **二进制属性**: 下载文件的二进制属性名（默认：data）

##### 列出对象
- **OSS区域**: OSS区域端点
- **存储桶名称**: 目标OSS存储桶名称
- **前缀**: 对象名称前缀过滤（可选）
- **最大返回数量**: 返回对象的最大数量（默认100）
- **标记**: 分页标记（可选）

##### 删除对象
- **OSS区域**: OSS区域端点
- **存储桶名称**: 目标OSS存储桶名称
- **对象键**: 要删除的文件路径

#### OSS签名URL参数

##### 基本配置
- **OSS区域**: OSS区域端点
- **存储桶名称**: 目标OSS存储桶名称
- **对象键**: 要生成签名URL的文件路径
- **HTTP方法**: 签名URL的HTTP方法（GET、POST、PUT、DELETE）
- **过期时间**: URL过期时间（秒，默认3600）

##### 高级选项
- **请求头**: 要签名的HTTP头（JSON格式）
- **查询参数**: 要签名的查询参数（JSON格式）
- **斜杠安全**: 是否启用对象键中的斜杠转义保护
- **附加头**: 附加的签名头（JSON格式）

### 轮询设置（仅完整工作流）
- **轮询间隔**: 查询结果的时间间隔（默认10秒）
- **最大轮询次数**: 防止无限等待（默认60次）

### 支持的文件格式

- **音频格式**: WAV, MP3, M4A, FLAC, AAC等
- **文件大小**: 建议不超过500MB
- **文件来源**: 支持HTTP/HTTPS链接

### 数据输出

节点将返回包含以下信息的JSON数据：

#### 文件转录输出
```json
{
  "success": true,
  "statusText": "SUCCESS",
  "taskId": "your_task_id",
  "result": {
    "sentences": [
      {
        "text": "转录的文本内容",
        "begin_time": 0,
        "end_time": 3000
      }
    ]
  },
  "pollCount": 5,
  "response": { /* 完整API响应 */ }
}
```

#### OSS上传输出
```json
{
  "success": true,
  "url": "https://bucket.oss-cn-beijing.aliyuncs.com/path/to/file.jpg",
  "name": "path/to/file.jpg",
  "res": { /* OSS响应信息 */ },
  "uploadResult": { /* 完整上传结果 */ }
}
```

#### OSS下载输出
```json
{
  "success": true,
  "objectKey": "path/to/file.jpg",
  "binaryData": {
    "data": { /* 二进制数据对象 */ }
  },
  "downloadResult": {
    "url": "https://bucket.oss-cn-beijing.aliyuncs.com/path/to/file.jpg",
    "name": "path/to/file.jpg",
    "res": { /* OSS响应信息 */ }
  }
}
```

#### OSS列表输出
```json
{
  "success": true,
  "objects": [
    {
      "name": "path/to/file1.jpg",
      "size": 1024,
      "lastModified": "2024-01-01T00:00:00.000Z"
    }
  ],
  "prefix": "path/",
  "marker": "next_marker",
  "nextMarker": "next_marker",
  "maxKeys": 100,
  "isTruncated": false,
  "listResult": { /* 完整列表结果 */ }
}
```

#### OSS签名URL输出
```json
{
  "success": true,
  "signedUrl": "https://bucket.oss-cn-beijing.aliyuncs.com/path/to/file.jpg?signature=...",
  "signedInternalUrl": "https://bucket.oss-cn-beijing-internal.aliyuncs.com/path/to/file.jpg?signature=...",
  "objectKey": "path/to/file.jpg",
  "method": "GET",
  "expires": 3600,
  "options": { /* 签名选项 */ }
}
```

## 使用场景

### 场景1：简单文件转录
```
音频文件 → 文件转录节点（完整工作流）→ 转录结果
```

### 场景2：批量文件处理
```
文件列表 → 循环节点 → 文件转录节点（仅提交任务）→ 收集任务ID
任务ID列表 → 循环节点 → 文件转录节点（仅查询结果）→ 处理结果
```

### 场景3：异步处理
```
文件上传 → 文件转录节点（仅提交任务）→ 其他工作流操作
稍后 → 文件转录节点（仅查询结果）→ 获取转录结果
```

### 场景4：OSS文件管理
```
文件上传 → OSS上传节点 → 存储文件到云存储
文件下载 → OSS下载节点 → 从云存储获取文件
文件列表 → OSS列表节点 → 查看存储桶内容
文件删除 → OSS删除节点 → 清理不需要的文件
```

### 场景5：OSS签名URL生成
```
文件存储 → OSS上传节点 → 生成签名URL → 分享临时访问链接
```

### 场景6：ECS实例管理
```
定时任务 → ECS查询节点 → 获取实例状态 → 发送通知
```

## 资源

* [n8n社区节点文档](https://docs.n8n.io/integrations/#community-nodes)
* [阿里云智能语音服务文档](https://help.aliyun.com/product/30413.html)
* [阿里云文件转录API参考](https://help.aliyun.com/document_detail/90727.html)
* [阿里云对象存储服务(OSS)文档](https://help.aliyun.com/product/31815.html)
* [阿里云OSS API参考](https://help.aliyun.com/document_detail/31947.html)
* [阿里云弹性计算服务(ECS)文档](https://help.aliyun.com/product/25365.html)
* [阿里云ECS API参考](https://help.aliyun.com/document_detail/25484.html)

## 版本历史

### v0.2.0 (当前版本)
- **新增OSS对象存储服务支持**
  - 文件上传功能
  - 文件下载功能
  - 对象列表查询功能
  - 对象删除功能
- **新增OSS签名URL生成功能**
  - 支持多种HTTP方法（GET、POST、PUT、DELETE）
  - 可配置过期时间
  - 支持自定义请求头和查询参数
  - 生成内部和外部访问URL
- **新增ECS弹性计算服务支持**
  - 实例信息查询功能
- **优化节点架构**
  - 采用模块化资源管理
  - 统一的错误处理机制
  - 更好的代码组织结构

### v0.1.0
- 初始版本发布
- 支持完整的文件转录工作流
- 支持单独提交任务和查询结果
- 基于官方阿里云SDK实现
- 自动轮询机制
- 完整的错误处理

### 计划功能
- 支持更多音频格式
- 添加批量处理功能
- 优化大文件处理
- 增加转录质量配置选项
- 支持更多阿里云服务（RDS、SLB等）
- 添加更多OSS高级功能（分片上传、断点续传等）

---

**注意**: 使用此节点需要有效的阿里云账户和相应服务的权限。请确保遵守阿里云的使用条款和API调用限制。不同功能需要不同的服务权限，请根据实际使用情况配置相应的访问权限。
