import { SetMetadata } from '@nestjs/common';

export const RAW_RESPONSE_KEY = 'raw_response';

/**
 * Marks a controller or route as returning raw data.
 * The TransformInterceptor will skip the {data, meta} envelope for these routes.
 *
 * Used by DashboardCompatController so the React dashboard receives plain
 * arrays/objects matching the original Express API contract.
 */
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);
