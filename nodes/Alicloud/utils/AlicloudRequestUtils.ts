import { IExecuteFunctions, NodeOperationError, IRequestOptions } from 'n8n-workflow';

class AlicloudRequestUtils {
	static async request(this: IExecuteFunctions, options: IRequestOptions) {

		// Set basic configuration for Alibaba Cloud API
		options.headers = {
			...options.headers,
			'Content-Type': 'application/json',
			'User-Agent': 'n8n-alicloud-node/1.0.0',
		};

		try {
			const response = await this.helpers.requestWithAuthentication.call(
				this,
				'alicloudCredentialsApi',
				options
			);

			// Check for errors in Alibaba Cloud API response
			if (response && typeof response === 'object') {
				if (response.Code && response.Code !== 'Success') {
					throw new NodeOperationError(
						this.getNode(),
						`Alibaba Cloud API error: ${response.Code} - ${response.Message || 'Unknown error'}`
					);
				}
			}

			return response;
		} catch (error) {
			if (error instanceof NodeOperationError) {
				throw error;
			}

			throw new NodeOperationError(
				this.getNode(),
				`Request failed: ${error.message}`
			);
		}
	}

}

export default AlicloudRequestUtils;
