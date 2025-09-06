import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { ResourceOperations } from '../../../help/type/IResource';

const EcsDescribeInstancesOperate: ResourceOperations = {
	name: 'Query Instances',
	value: 'ecs:describeInstances',
	description: 'Query ECS instance information',
	options: [
		{
			displayName: 'ECS Region',
			name: 'ecsRegion',
			type: 'string',
			default: 'cn-beijing',
			description: 'ECS region ID',
			required: true,
		},
		{
			displayName: 'Additional Fields',
			name: 'additionalFields',
			type: 'collection',
			placeholder: 'Add Field',
			default: {},
			options: [
				{
					displayName: 'Instance Charge Type',
					name: 'instanceChargeType',
					type: 'options',
					default: 'PostPaid',
					options: [
						{
							name: 'PrePaid',
							value: 'PrePaid',
						},
						{
							name: 'PostPaid',
							value: 'PostPaid',
							description: 'Pay-as-you-go',
						},
					],
					description: 'Instance payment method',
				},
				{
					displayName: 'Instance ID',
					name: 'instanceIds',
					type: 'string',
					default: '',
					description: 'Instance ID. Can be multiple instance IDs in a JSON array, up to 100 IDs, separated by commas.',
				},
				{
					displayName: 'Instance Name',
					name: 'instanceName',
					type: 'string',
					default: '',
					description: 'Instance name, supports wildcard * for fuzzy search',
				},
				{
					displayName: 'Instance Status',
					name: 'status',
					type: 'options',
					default: 'Running',
					options: [
						{
							name: 'Pending',
							value: 'Pending',
							description: 'Creating',
						},
						{
							name: 'Running',
							value: 'Running',
						},
						{
							name: 'Starting',
							value: 'Starting',
						},
						{
							name: 'Stopped',
							value: 'Stopped',
						},
						{
							name: 'Stopping',
							value: 'Stopping',
						},
					],
				},
				{
					displayName: 'Instance Type',
					name: 'instanceType',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Instance Type Family',
					name: 'instanceTypeFamily',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Key Pair Name',
					name: 'keyPairName',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Page Number',
					name: 'pageNumber',
					type: 'number',
					default: 1,
					description: 'Page number of query results. Start value: 1. Default: 1.',
				},
				{
					displayName: 'Page Size',
					name: 'pageSize',
					type: 'number',
					default: 10,
					description: 'Number of items per page for pagination. Maximum: 100. Default: 10.',
				},
				{
					displayName: 'Private IP Address',
					name: 'privateIpAddresses',
					type: 'string',
					default: '',
					description: 'List of private IP addresses of instances. When InstanceNetworkType=vpc, you can specify private IPs. When the number of specified private IPs is less than the number of instances, the system will automatically assign private IPs.',
				},
				{
					displayName: 'Public IP Address',
					name: 'publicIpAddresses',
					type: 'string',
					default: '',
					description: 'List of public IP addresses of instances',
				},
				{
					displayName: 'Security Group ID',
					name: 'securityGroupId',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Tags',
					name: 'tags',
					type: 'string',
					default: '',
					description: 'Instance tags. Format: [{"Key": "TagKey", "Value": "TagValue"}, ...].',
				},
				{
					displayName: 'VPC ID',
					name: 'vpcId',
					type: 'string',
					default: '',
				},
				{
					displayName: 'VSwitch ID',
					name: 'vSwitchId',
					type: 'string',
					default: '',
				},
				{
					displayName: 'Zone ID',
					name: 'zoneId',
					type: 'string',
					default: '',
				},
			],
		},
	],
	async call(this: IExecuteFunctions, index: number): Promise<IDataObject> {
		const ecsRegion = this.getNodeParameter('ecsRegion', index) as string;
		const additionalFields = this.getNodeParameter('additionalFields', index) as IDataObject;

		// Build request parameters
		const requestParams: IDataObject = {
			RegionId: ecsRegion,
			...additionalFields,
		};

		// Handle special fields
		if (requestParams.instanceIds && typeof requestParams.instanceIds === 'string') {
			requestParams.InstanceIds = requestParams.instanceIds.split(',').map(id => id.trim());
		}
		if (requestParams.privateIpAddresses && typeof requestParams.privateIpAddresses === 'string') {
			requestParams.PrivateIpAddresses = requestParams.privateIpAddresses.split(',').map(ip => ip.trim());
		}
		if (requestParams.publicIpAddresses && typeof requestParams.publicIpAddresses === 'string') {
			requestParams.PublicIpAddresses = requestParams.publicIpAddresses.split(',').map(ip => ip.trim());
		}
		if (requestParams.tags && typeof requestParams.tags === 'string') {
			try {
				requestParams.Tag = JSON.parse(requestParams.tags);
			} catch (error) {
				throw new Error('Invalid tag format, please use correct JSON format');
			}
		}

		// Remove original fields, use Alibaba Cloud API standard field names
		delete requestParams.instanceIds;
		delete requestParams.privateIpAddresses;
		delete requestParams.publicIpAddresses;
		delete requestParams.tags;

		// Use Alibaba Cloud ECS SDK for query
		const Core = require('@alicloud/pop-core');
		const credentials = await this.getCredentials('alicloudCredentialsApi');

		const client = new Core({
			accessKeyId: credentials.accessKeyId,
			accessKeySecret: credentials.accessKeySecret,
			endpoint: `https://ecs.${ecsRegion}.aliyuncs.com`,
			apiVersion: '2014-05-26',
		});

		try {
			const result = await client.request('DescribeInstances', requestParams, {
				method: 'POST',
			});

			return {
				success: true,
				instances: result.Instances?.Instance || [],
				totalCount: result.TotalCount,
				pageNumber: result.PageNumber,
				pageSize: result.PageSize,
				requestId: result.RequestId,
				response: result,
			};
		} catch (error) {
			throw new Error(`ECS instance query failed: ${error.message}`);
		}
	},
};

export default EcsDescribeInstancesOperate;
