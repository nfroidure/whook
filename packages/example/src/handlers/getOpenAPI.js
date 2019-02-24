import getOpenAPI, {
  definition,
} from '@whook/swagger-ui/dist/handlers/getOpenAPI';

// TODO: Use WHOOK_PLUGINS to get handlers from plugins
// instead of proxying here
export { definition };
export default getOpenAPI;
