/*
 * ECS Module
 * =====================================================================
 * ECS 云服务器功能模块
 * ---------------------------------------------------------------------
 * 支持操作：
 *   • 查询实例详情 (describeInstances)
 * ---------------------------------------------------------------------
 * 作者：Yanchao Ma — 2025‑01‑06
 */

import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import Ecs20140526, { DescribeInstancesRequest } from '@alicloud/ecs20140526';
import { Config } from '@alicloud/openapi-client';
import { RuntimeOptions } from '@alicloud/tea-util';

export interface EcsCredentials {
	accessKeyId: string;
	accessKeySecret: string;
}

export interface EcsAdditionalFields {
	instanceIds?: string;
	vpcId?: string;
	vSwitchId?: string;
	zoneId?: string;
	instanceType?: string;
	instanceTypeFamily?: string;
	instanceName?: string;
	instanceChargeType?: string;
	status?: string;
	privateIpAddresses?: string;
	publicIpAddresses?: string;
	securityGroupId?: string;
	keyPairName?: string;
	tags?: string;
	pageSize?: number;
	pageNumber?: number;
}

export class EcsModule {
	constructor(private functions: IExecuteFunctions) {}

	async execute(itemIndex: number): Promise<INodeExecutionData> {
		const credentials = (await this.functions.getCredentials('alicloudCredentialsApi')) as EcsCredentials;
		const operation = this.functions.getNodeParameter('ecsOperation', itemIndex) as string;
		const region = this.functions.getNodeParameter('ecsRegion', itemIndex) as string;

		// 创建客户端配置
		const config = new Config({
			accessKeyId: credentials.accessKeyId,
			accessKeySecret: credentials.accessKeySecret,
		});

		// 设置 ECS 端点
		config.endpoint = `ecs.${region}.aliyuncs.com`;
		const client = new Ecs20140526(config);
		const runtime = new RuntimeOptions({});

		if (operation === 'describeInstances') {
			return await this.describeInstances(client, runtime, itemIndex, region);
		}

		throw new NodeOperationError(this.functions.getNode(), `Unknown ECS operation: ${operation}`);
	}

	private async describeInstances(client: Ecs20140526, runtime: RuntimeOptions, itemIndex: number, region: string): Promise<INodeExecutionData> {
		// 获取额外参数
		const additionalFields = this.functions.getNodeParameter('additionalFields', itemIndex) as EcsAdditionalFields;

		const request = new DescribeInstancesRequest({
			regionId: region,
			pageSize: additionalFields.pageSize,
			pageNumber: additionalFields.pageNumber,
		});

		// 添加所有可选参数
		if (additionalFields.instanceIds) {
			try {
				const instanceIds = JSON.parse(additionalFields.instanceIds);
				if (Array.isArray(instanceIds)) {
					request.instanceIds = JSON.stringify(instanceIds);
				} else {
					throw new NodeOperationError(this.functions.getNode(), 'Instance IDs must be an array');
				}
			} catch (e) {
				if (e instanceof NodeOperationError) {
					throw e;
				}
				throw new NodeOperationError(this.functions.getNode(), 'Invalid instance IDs JSON format');
			}
		}

		if (additionalFields.vpcId) {
			request.vpcId = additionalFields.vpcId;
		}

		if (additionalFields.vSwitchId) {
			request.vSwitchId = additionalFields.vSwitchId;
		}

		if (additionalFields.zoneId) {
			request.zoneId = additionalFields.zoneId;
		}

		if (additionalFields.instanceType) {
			request.instanceType = additionalFields.instanceType;
		}

		if (additionalFields.instanceTypeFamily) {
			request.instanceTypeFamily = additionalFields.instanceTypeFamily;
		}

		if (additionalFields.instanceName) {
			request.instanceName = additionalFields.instanceName;
		}

		if (additionalFields.instanceChargeType) {
			request.instanceChargeType = additionalFields.instanceChargeType;
		}

		if (additionalFields.status) {
			request.status = additionalFields.status;
		}

		if (additionalFields.privateIpAddresses) {
			try {
				const ips = JSON.parse(additionalFields.privateIpAddresses);
				if (Array.isArray(ips)) {
					request.privateIpAddresses = JSON.stringify(ips);
				} else {
					throw new NodeOperationError(this.functions.getNode(), 'Private IP addresses must be an array');
				}
			} catch (e) {
				if (e instanceof NodeOperationError) {
					throw e;
				}
				throw new NodeOperationError(this.functions.getNode(), 'Invalid private IP addresses JSON format');
			}
		}

		if (additionalFields.publicIpAddresses) {
			try {
				const ips = JSON.parse(additionalFields.publicIpAddresses);
				if (Array.isArray(ips)) {
					request.publicIpAddresses = JSON.stringify(ips);
				} else {
					throw new NodeOperationError(this.functions.getNode(), 'Public IP addresses must be an array');
				}
			} catch (e) {
				if (e instanceof NodeOperationError) {
					throw e;
				}
				throw new NodeOperationError(this.functions.getNode(), 'Invalid public IP addresses JSON format');
			}
		}

		if (additionalFields.securityGroupId) {
			request.securityGroupId = additionalFields.securityGroupId;
		}

		if (additionalFields.keyPairName) {
			request.keyPairName = additionalFields.keyPairName;
		}

		if (additionalFields.tags) {
			try {
				const tags = JSON.parse(additionalFields.tags);
				if (Array.isArray(tags)) {
					request.tag = tags;
				} else {
					throw new NodeOperationError(this.functions.getNode(), 'Tags must be an array');
				}
			} catch (e) {
				if (e instanceof NodeOperationError) {
					throw e;
				}
				throw new NodeOperationError(this.functions.getNode(), 'Invalid tags JSON format');
			}
		}

		const response = await client.describeInstancesWithOptions(request, runtime);
		const instances = response.body.instances?.instance || [];

		return {
			json: {
				success: true,
				instances: instances,
				count: instances.length,
				operation: 'describeInstances',
				region: region,
				request: {
					regionId: region,
					pageSize: additionalFields.pageSize,
					pageNumber: additionalFields.pageNumber,
				}
			}
		};
	}
}
