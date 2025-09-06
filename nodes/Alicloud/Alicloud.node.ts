/*
 * n8n Custom Node: Alicloud Services
 * =====================================================================
 * Dependencies
 * ---------------------------------------------------------------------
 * - Depends on official SDKs `@alicloud/nls-filetrans-2018-08-17` and `ali-oss`.
 * ---------------------------------------------------------------------
 * Supported Operations
 *   • File Transcription (Complete Workflow, Submit Task, Query Result)
 *   • OSS Signed URL Generation
 * ---------------------------------------------------------------------
 * Author: Yanchao Ma — 2025‑01‑06
 */

/* -------------------------------------------------------------------
 * Dependencies Import
 * ---------------------------------------------------------------- */
import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

// 导入功能模块
import { FileTranscriptionModule } from '../modules/FileTranscription';
import { OssModule } from '../modules/Oss';
import { OssSignedUrlModule } from '../modules/OssSignedUrl';
import { EcsModule } from '../modules/Ecs';

/* -------------------------------------------------------------------
 * Node Implementation
 * ---------------------------------------------------------------- */
export class Alicloud implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Alicloud Services',
		name: 'alicloud',
		icon: 'file:./alicloud.logo.svg',
		group: ['transform'],
		version: 1,
		description: 'Operate Alibaba Cloud services within n8n workflows (File Transcription, OSS Operations, ECS Instances).',
		defaults: {
			name: 'Alicloud Services',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'alicloudCredentialsApi',
				required: true,
			},
		],
		properties: [
			/* ------------------------------ General ------------------------------ */
			{
				displayName: 'Action',
				name: 'action',
				type: 'options',
				options: [
					{
						name: 'File Transcription Actions',
						value: 'fileTranscriptionActions',
						action: 'File transcription operations complete workflow submit task query result',
						description: 'File transcription operations (complete workflow, submit task, query result)',
					},
					{
						name: 'OSS Actions',
						value: 'ossActions',
						action: 'Oss operations upload download list delete signed url',
						description: 'OSS operations (upload, download, list, delete, signed URL)',
					},
					{
						name: 'ECS Instances',
						value: 'ecsInstances',
						action: 'Ecs instance management operations',
						description: 'ECS instance management operations',
					},
					{
						name: 'OSS Signed URL',
						value: 'ossSignedUrl',
						action: 'Generate OSS signed URL',
						description: 'Generate signed URLs for OSS objects',
					},
				],
				default: 'fileTranscriptionActions',
				noDataExpression: true,
			},
			{
				displayName: 'File Transcription Operation',
				name: 'fileTranscriptionOperation',
				type: 'options',
				options: [
					{ name: 'Complete Workflow', value: 'complete' },
					{ name: 'Submit Task Only', value: 'submit' },
					{ name: 'Query Result Only', value: 'query' },
				],
				default: 'complete',
				displayOptions: {
					show: {
						action: ['fileTranscriptionActions'],
					},
				},
				description: 'Select the specific file transcription operation',
			},
			{
				displayName: 'OSS Operation',
				name: 'ossOperation',
				type: 'options',
				options: [
					{ name: 'Upload', value: 'upload' },
					{ name: 'Download', value: 'download' },
					{ name: 'List Objects', value: 'list' },
					{ name: 'Delete', value: 'delete' },
				],
				default: 'upload',
				displayOptions: {
					show: {
						action: ['ossActions'],
					},
				},
				description: 'Select the specific OSS operation',
			},
			{
				displayName: 'ECS Operation',
				name: 'ecsOperation',
				type: 'options',
				options: [
					{ name: 'Describe Instances', value: 'describeInstances' },
				],
				default: 'describeInstances',
				displayOptions: {
					show: {
						action: ['ecsInstances'],
					},
				},
				description: 'Select the specific ECS operation',
			},

			/* ------------------------------ File Transcription Configuration ------------------------------ */
			{
				displayName: 'File Transcription AppKey',
				name: 'fileTranscriptionAppKey',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description: 'Intelligent Speech Service project AppKey (required for file transcription). Get it from: https://nls-portal.console.aliyun.com/applist.',
				displayOptions: {
					show: {
						action: ['fileTranscriptionActions'],
					},
				},
				required: true,
			},
			{
				displayName: 'File Transcription Endpoint',
				name: 'fileTranscriptionEndpoint',
				type: 'string',
				default: 'http://filetrans.cn-beijing.aliyuncs.com',
				description: 'File transcription service endpoint address',
				displayOptions: {
					show: {
						action: ['fileTranscriptionActions'],
					},
				},
				required: true,
			},
			{
				displayName: 'File Transcription API Version',
				name: 'fileTranscriptionApiVersion',
				type: 'string',
				default: '2018-08-17',
				description: 'File transcription API version number',
				displayOptions: {
					show: {
						action: ['fileTranscriptionActions'],
					},
				},
				required: true,
			},
			{
				displayName: 'Task Parameter Configuration Mode',
				name: 'taskConfigMode',
				type: 'options',
				options: [
					{ name: 'Simple Settings', value: 'individual' },
					{ name: 'Advanced JSON', value: 'json' },
				],
				default: 'individual',
				description: 'Choose how to configure transcription parameters. For more details, see: https://help.aliyun.com/zh/isi/developer-reference/api-reference-2.',
				displayOptions: {
					show: {
						action: ['fileTranscriptionActions'],
						fileTranscriptionOperation: ['submit', 'complete'],
					},
				},
			},
			{
				displayName: 'File Link',
				name: 'fileLink',
				type: 'string',
				description: 'Audio file link address to be transcribed',
				default: '',
				displayOptions: {
					show: {
						action: ['fileTranscriptionActions'],
						fileTranscriptionOperation: ['submit', 'complete'],
						taskConfigMode: ['individual'],
					},
				},
				required: true,
			},
			{
				displayName: 'Task ID',
				name: 'taskId',
				type: 'string',
				description: 'Transcription task ID for querying results',
				default: '',
				displayOptions: {
					show: {
						action: ['fileTranscriptionActions'],
						fileTranscriptionOperation: ['query'],
					},
				},
				required: true,
			},
			{
				displayName: 'Version',
				name: 'version',
				type: 'string',
				description: 'API version number',
				default: '4.0',
				displayOptions: {
					show: {
						action: ['fileTranscriptionActions'],
						fileTranscriptionOperation: ['submit', 'complete'],
						taskConfigMode: ['individual'],
					},
				},
			},
			{
				displayName: 'Enable Word Information',
				name: 'enableWords',
				type: 'boolean',
				description: 'Whether to output word information, requires version 4.0',
				default: false,
				displayOptions: {
					show: {
						action: ['fileTranscriptionActions'],
						fileTranscriptionOperation: ['submit', 'complete'],
						taskConfigMode: ['individual'],
					},
				},
			},
			{
				displayName: 'Enable Sample Rate Adaptive',
				name: 'enableSampleRateAdaptive',
				type: 'boolean',
				description: 'Whether to enable sample rate adaptive',
				default: true,
				displayOptions: {
					show: {
						action: ['fileTranscriptionActions'],
						fileTranscriptionOperation: ['submit', 'complete'],
						taskConfigMode: ['individual'],
					},
				},
			},
			{
				displayName: 'Task Parameters JSON',
				name: 'taskJson',
				type: 'json',
				description: 'JSON format configuration for task parameters',
				default: '{\n  "file_link": "your_file_link",\n  "version": "4.0",\n  "enable_words": false,\n  "enable_sample_rate_adaptive": true\n}',
				displayOptions: {
					show: {
						action: ['fileTranscriptionActions'],
						fileTranscriptionOperation: ['submit', 'complete'],
						taskConfigMode: ['json'],
					},
				},
			},
			{
				displayName: 'Polling Interval (Ms)',
				name: 'pollInterval',
				type: 'number',
				description: 'Polling interval time when querying results',
				default: 10000,
				displayOptions: {
					show: {
						action: ['fileTranscriptionActions'],
						fileTranscriptionOperation: ['complete'],
					},
				},
			},
			{
				displayName: 'Max Polling Count',
				name: 'maxPollCount',
				type: 'number',
				description: 'Maximum polling count to prevent infinite waiting',
				default: 60,
				displayOptions: {
					show: {
						action: ['fileTranscriptionActions'],
						fileTranscriptionOperation: ['complete'],
					},
				},
			},

			/* ------------------------------ OSS Configuration ------------------------------ */
			{
				displayName: 'OSS Region',
				name: 'ossRegion',
				type: 'string',
				default: 'oss-cn-beijing',
				description: 'OSS region endpoint (e.g., oss-cn-hongkong, oss-cn-beijing)',
				displayOptions: {
					show: {
						action: ['ossActions', 'ossSignedUrl'],
					},
				},
				required: true,
			},
			{
				displayName: 'OSS Bucket Name',
				name: 'ossBucket',
				type: 'string',
				default: '',
				description: 'Name of the OSS bucket to operate on',
				displayOptions: {
					show: {
						action: ['ossActions', 'ossSignedUrl'],
					},
				},
				required: true,
			},
			{
				displayName: 'OSS Custom Endpoint',
				name: 'ossEndpoint',
				type: 'string',
				default: '',
				description: 'Optional custom OSS endpoint URL (overrides region-based endpoint)',
				displayOptions: {
					show: {
						action: ['ossActions', 'ossSignedUrl'],
					},
				},
			},
			{
				displayName: 'Object Key',
				name: 'objectKey',
				type: 'string',
				description: 'The key (path) of the object in the bucket (e.g., path/to/file.jpg)',
				default: '',
				displayOptions: {
					show: {
						action: ['ossActions'],
						ossOperation: ['upload', 'download', 'delete'],
					},
				},
				required: true,
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				description: 'Binary property name for upload / download',
				default: 'data',
				displayOptions: {
					show: {
						action: ['ossActions'],
						ossOperation: ['upload', 'download'],
					},
				},
				required: true,
			},
			{
				displayName: 'Prefix',
				name: 'prefix',
				type: 'string',
				description: 'Prefix filter when listing objects',
				default: '',
				displayOptions: {
					show: {
						action: ['ossActions'],
						ossOperation: ['list'],
					},
				},
			},

			/* ------------------------------ OSS Signed URL Parameters ------------------------------ */
			{
				displayName: 'Object Key',
				name: 'signedUrlObjectKey',
				type: 'string',
				description: 'The key (path) of the object in the bucket (e.g., path/to/file.jpg)',
				default: '',
				displayOptions: {
					show: {
						action: ['ossSignedUrl'],
					},
				},
				required: true,
			},
			{
				displayName: 'HTTP Method',
				name: 'signedUrlMethod',
				type: 'options',
				options: [
					{ name: 'DELETE', value: 'DELETE' },
					{ name: 'GET', value: 'GET' },
					{ name: 'POST', value: 'POST' },
					{ name: 'PUT', value: 'PUT' },
				],
				default: 'GET',
				description: 'HTTP method for the signed URL',
				displayOptions: {
					show: {
						action: ['ossSignedUrl'],
					},
				},
			},
			{
				displayName: 'Expires (Seconds)',
				name: 'signedUrlExpires',
				type: 'number',
				description: 'URL expiration time in seconds',
				default: 3600,
				displayOptions: {
					show: {
						action: ['ossSignedUrl'],
					},
				},
				required: true,
			},
			{
				displayName: 'Additional Options',
				name: 'signedUrlAdditionalOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						action: ['ossSignedUrl'],
					},
				},
				options: [
					{
						displayName: 'Headers',
						name: 'headers',
						type: 'json',
						description: 'HTTP headers to be signed (JSON format)',
						default: '{}',
					},
					{
						displayName: 'Query Parameters',
						name: 'params',
						type: 'json',
						description: 'Query parameters to be signed (JSON format)',
						default: '{}',
					},
					{
						displayName: 'Slash Safe',
						name: 'slashSafe',
						type: 'boolean',
						description: 'Whether to enable slash escape protection in object key',
						default: false,
					},
					{
						displayName: 'Additional Headers',
						name: 'additionalHeaders',
						type: 'json',
						description: 'Additional headers to be signed (JSON format)',
						default: '{}',
					},
				],
			},

			/* ------------------------------ ECS Configuration ------------------------------ */
			{
				displayName: 'ECS Region',
				name: 'ecsRegion',
				type: 'string',
				default: 'cn-beijing',
				description: 'ECS region ID for ECS operations',
				displayOptions: {
					show: {
						action: ['ecsInstances'],
					},
				},
				required: true,
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						action: ['ecsInstances'],
						ecsOperation: ['describeInstances'],
					},
				},
				options: [
					{
						displayName: 'InstanceChargeType',
						name: 'instanceChargeType',
						type: 'options',
						default: 'PostPaid',
						options: [
							{
								name: 'PrePaid',
								value: 'PrePaid',
								description: '包年包月',
							},
							{
								name: 'PostPaid',
								value: 'PostPaid',
								description: '按量付费',
							},
						],
						description: '实例的付费方式。',
					},
					{
						displayName: 'InstanceIds',
						name: 'instanceIds',
						type: 'string',
						default: '',
						description:
							'实例ID。取值可以由多个实例ID组成一个JSON数组，最多支持100个ID，ID之间用半角逗号（,）隔开。',
					},
					{
						displayName: 'InstanceName',
						name: 'instanceName',
						type: 'string',
						default: '',
						description: '实例名称，支持使用通配符*进行模糊搜索。',
					},
					{
						displayName: 'InstanceType',
						name: 'instanceType',
						type: 'string',
						default: '',
						description: '实例规格。',
					},
					{
						displayName: 'InstanceTypeFamily',
						name: 'instanceTypeFamily',
						type: 'string',
						default: '',
						description: '实例规格族。',
					},
					{
						displayName: 'KeyPairName',
						name: 'keyPairName',
						type: 'string',
						default: '',
						description: '密钥对名称。',
					},
					{
						displayName: 'PageNumber',
						name: 'pageNumber',
						type: 'number',
						default: 1,
						description: '查询结果的页码。起始值：1。默认值：1。',
					},
					{
						displayName: 'PageSize',
						name: 'pageSize',
						type: 'number',
						default: 10,
						description: '分页查询时设置的每页行数。最大值：100。默认值：10。',
					},
					{
						displayName: 'PrivateIpAddresses',
						name: 'privateIpAddresses',
						type: 'string',
						default: '',
						description:
							'实例的私网IP地址列表。当InstanceNetworkType=vpc时，您可以指定实例的私网IP。当您指定的私网IP地址数量小于实例数量时，系统将自动分配私网IP地址。',
					},
					{
						displayName: 'PublicIpAddresses',
						name: 'publicIpAddresses',
						type: 'string',
						default: '',
						description: '实例的公网IP地址列表。',
					},
					{
						displayName: 'SecurityGroupId',
						name: 'securityGroupId',
						type: 'string',
						default: '',
						description: '安全组ID。',
					},
					{
						displayName: 'Status',
						name: 'status',
						type: 'options',
						default: 'Running',
						options: [
							{
								name: 'Pending',
								value: 'Pending',
								description: '创建中',
							},
							{
								name: 'Running',
								value: 'Running',
								description: '运行中',
							},
							{
								name: 'Starting',
								value: 'Starting',
								description: '启动中',
							},
							{
								name: 'Stopped',
								value: 'Stopped',
								description: '已停止',
							},
							{
								name: 'Stopping',
								value: 'Stopping',
								description: '停止中',
							},
						],
						description: '实例状态。',
					},
					{
						displayName: 'Tag',
						name: 'tags',
						type: 'string',
						default: '',
						description: '实例的标签。格式：[{"Key": "TagKey", "Value": "TagValue"}, ...]。',
					},
					{
						displayName: 'VpcId',
						name: 'vpcId',
						type: 'string',
						default: '',
						description: '专有网络VPC ID。',
					},
					{
						displayName: 'VSwitchId',
						name: 'vSwitchId',
						type: 'string',
						default: '',
						description: '虚拟交换机ID。',
					},
					{
						displayName: 'ZoneId',
						name: 'zoneId',
						type: 'string',
						default: '',
						description: '可用区ID。',
					},
				],
			},
		],
	};

	/* ------------------------------ Execution Entry ------------------------------ */
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			const action = this.getNodeParameter('action', i) as string;

			try {
				let result: INodeExecutionData;

				switch (action) {
					case 'fileTranscriptionActions':
						/* --------------------------- File Transcription Actions --------------------------- */
						const fileTranscriptionModule = new FileTranscriptionModule(this);
						result = await fileTranscriptionModule.execute(i);
						break;

					case 'ossActions':
						/* --------------------------- OSS Actions --------------------------- */
						const ossModule = new OssModule(this);
						result = await ossModule.execute(i);
						break;

					case 'ossSignedUrl':
						/* --------------------------- OSS Signed URL --------------------------- */
						const ossSignedUrlModule = new OssSignedUrlModule(this);
						result = await ossSignedUrlModule.execute(i);
						break;

					case 'ecsInstances':
						/* --------------------------- ECS Instances --------------------------- */
						const ecsModule = new EcsModule(this);
						result = await ecsModule.execute(i);
						break;

					default:
						throw new NodeOperationError(this.getNode(), `Unknown action: ${action}`);
				}

				returnData.push(result);

			} catch (error) {
				const errMsg = (error as Error).message;
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							success: false,
							error: errMsg,
							action: action
						}
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
