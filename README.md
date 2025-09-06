# n8n-nodes-alicloud

[![English](https://img.shields.io/badge/English-Click-yellow)](README.md)
[![中文文档](https://img.shields.io/badge/中文文档-点击查看-orange)](README-zh.md)

This is an n8n community node that allows you to use Alibaba Cloud Intelligent Speech Service for file transcription in your n8n workflows.

Alibaba Cloud Intelligent Speech Service provides high-precision speech recognition capabilities, supporting file transcription for multiple audio formats. Through this node, you can easily convert audio files to text and integrate them into your automated workflows.

[n8n](https://n8n.io/) is a workflow automation platform with a [fair-code license](https://docs.n8n.io/reference/license/).

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage Instructions](#usage-instructions)  
[Resources](#resources)  
[Version History](#version-history)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

Additionally, you can also refer to these [n8n workflow templates](https://github.com/crazyyanchao/n8n-workflow-template).

## Operations

This node supports the following operations:

- **File Transcription (Complete Workflow)**: Automatically handles task submission and result polling in a complete process (recommended)
- **Submit Task Only**: Only submits transcription tasks without waiting for results
- **Query Results Only**: Queries transcription results for already submitted tasks

## Credentials

To use this node, you need:

1. **Register Alibaba Cloud Account**: Visit [Alibaba Cloud official website](https://www.aliyun.com/) to register an account
2. **Enable Intelligent Speech Service**: Enable Intelligent Speech Service in the Alibaba Cloud console
3. **Get Access Keys**: Create AccessKey ID and AccessKey Secret in the RAM console
4. **Get AppKey**: Obtain the project AppKey in the Intelligent Speech Service console
5. **Configure Credentials**: Configure Alibaba Cloud file transcription credentials in n8n

### Authentication Methods
- **AccessKey Authentication**: Use Alibaba Cloud AccessKey ID and Secret for API calls
- **AppKey Authentication**: Use the Intelligent Speech Service project AppKey

## Compatibility

- **Minimum n8n version**: 1.0.0
- **Node.js version**: >=22.16
- **Tested versions**: n8n 1.0.0+

## Usage Instructions

### Basic Configuration

1. **Add Alibaba Cloud File Transcription node** to your workflow
2. **Configure Credentials**: Select or create Alibaba Cloud file transcription API credentials
3. **Select Operation**: Choose the file transcription operation type
4. **Input File Link**: Provide the URL of the audio file to be transcribed

### Operation Types Explained

#### 1. File Transcription (Complete Workflow) - Recommended
- **Function**: One-click file transcription, automatically handles all internal processes
- **Input**: File link
- **Output**: Complete transcription results
- **Features**: Simplest and easiest to use, suitable for most scenarios

#### 2. Submit Task Only
- **Function**: Only submits transcription tasks and gets task ID
- **Input**: File link
- **Output**: Task ID and submission status
- **Usage**: Batch task submission or asynchronous processing

#### 3. Query Results Only
- **Function**: Queries transcription results for specified tasks
- **Input**: Task ID
- **Output**: Current task status and results
- **Usage**: Use in conjunction with "Submit Task Only"

### Parameter Configuration

#### Simple Settings Mode (Recommended)
- **File Link**: URL of the audio file to be transcribed
- **Version**: API version (default 4.0)
- **Enable Word Information**: Whether to output word information (default false)
- **Enable Sample Rate Adaptive**: Whether to enable sample rate adaptive (default true)

#### Advanced JSON Configuration Mode
```json
{
  "appkey": "your_app_key",
  "file_link": "your_file_link",
  "version": "4.0",
  "enable_words": false,
  "enable_sample_rate_adaptive": true
}
```

### Polling Settings (Complete Workflow Only)
- **Polling Interval**: Time interval for querying results (default 10 seconds)
- **Maximum Polling Count**: Prevents infinite waiting (default 60 times)

### Supported File Formats

- **Audio Formats**: WAV, MP3, M4A, FLAC, AAC, etc.
- **File Size**: Recommended not to exceed 500MB
- **File Source**: Supports HTTP/HTTPS links

### Data Output

The node will return JSON data containing the following information:

```json
{
  "success": true,
  "statusText": "SUCCESS",
  "taskId": "your_task_id",
  "result": {
    "sentences": [
      {
        "text": "Transcribed text content",
        "begin_time": 0,
        "end_time": 3000
      }
    ]
  },
  "pollCount": 5,
  "response": { /* Complete API response */ }
}
```

## Use Cases

### Scenario 1: Simple File Transcription
```
Audio File → File Transcription Node (Complete Workflow) → Transcription Results
```

### Scenario 2: Batch File Processing
```
File List → Loop Node → File Transcription Node (Submit Task Only) → Collect Task IDs
Task ID List → Loop Node → File Transcription Node (Query Results Only) → Process Results
```

### Scenario 3: Asynchronous Processing
```
File Upload → File Transcription Node (Submit Task Only) → Other Workflow Operations
Later → File Transcription Node (Query Results Only) → Get Transcription Results
```

## Resources

* [n8n Community Nodes Documentation](https://docs.n8n.io/integrations/#community-nodes)
* [Alibaba Cloud Intelligent Speech Service Documentation](https://help.aliyun.com/product/30413.html)
* [Alibaba Cloud File Transcription API Reference](https://help.aliyun.com/document_detail/90727.html)

## Version History

### v0.1.0 (Current Version)
- Initial version release
- Support for complete file transcription workflow
- Support for separate task submission and result querying
- Implementation based on official Alibaba Cloud SDK
- Automatic polling mechanism
- Complete error handling

### Planned Features
- Support for more audio formats
- Add batch processing functionality
- Optimize large file processing
- Add transcription quality configuration options

---

**Note**: Using this node requires a valid Alibaba Cloud account and Intelligent Speech Service permissions. Please ensure compliance with Alibaba Cloud's terms of use and API call limits.
