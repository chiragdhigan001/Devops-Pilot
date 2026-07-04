import Project from '../models/Project.js';

const sanitizeSubdomain = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .replace(/--+/g, '-')
  .slice(0, 40);

const getBaseDomain = () => process.env.PLATFORM_BASE_DOMAIN || 'lvh.me';
const getProtocol = () => process.env.PLATFORM_PUBLIC_PROTOCOL || 'http';
const getPublicPort = () => process.env.PLATFORM_PUBLIC_PORT || process.env.PORT || '5000';

const formatPortSegment = () => {
  const protocol = getProtocol();
  const port = getPublicPort();

  if ((protocol === 'http' && port === '80') || (protocol === 'https' && port === '443')) {
    return '';
  }

  return `:${port}`;
};

export const buildPublicUrl = (subdomain) => `${getProtocol()}://${subdomain}.${getBaseDomain()}${formatPortSegment()}`;

export const isPlatformBaseHost = (hostname) => {
  const normalizedHost = hostname.toLowerCase();
  return [
    getBaseDomain(),
    'localhost',
    '127.0.0.1',
  ].includes(normalizedHost);
};

// export const extractSubdomainFromHost = (hostHeader) => {
//   const hostname = String(hostHeader || '').split(':')[0].toLowerCase();
//   const baseDomain = getBaseDomain().toLowerCase();

//   if (!hostname || isPlatformBaseHost(hostname)) {
//     return null;
//   }

//   const suffix = `.${baseDomain}`;
//   if (!hostname.endsWith(suffix)) {
//     return null;
//   }

//   const subdomain = hostname.slice(0, -suffix.length);
//   return subdomain || null;
// };

export const extractSubdomainFromHost = (host) => {
  if (!host) return null;
  // Strip the port (e.g., test.lvh.me:5000 -> test.lvh.me)
  const hostname = host.split(':')[0]; 
  
  if (hostname.endsWith('.lvh.me')) {
    return hostname.replace('.lvh.me', '');
  }
  return null;
};

export const generateUniqueSubdomain = async (input, excludeProjectId = null) => {
  const base = sanitizeSubdomain(input, 'project') || 'project';
  let candidate = base;
  let counter = 1;

  while (true) {
    const existing = await Project.findOne({
      subdomain: candidate,
      ...(excludeProjectId ? { _id: { $ne: excludeProjectId } } : {}),
    }).select('_id');

    if (!existing) {
      return candidate;
    }

    counter += 1;
    candidate = `${base}-${counter}`.slice(0, 40);
  }
};

export const ensureProjectDomainFields = async (project) => {
  let shouldSave = false;

  if (!project.subdomain) {
    project.subdomain = await generateUniqueSubdomain(project.name || 'project', project._id);
    shouldSave = true;
  }

  const expectedPublicUrl = buildPublicUrl(project.subdomain);
  if (project.publicUrl !== expectedPublicUrl) {
    project.publicUrl = expectedPublicUrl;
    shouldSave = true;
  }

  if (shouldSave) {
    await project.save();
  }

  return project;
};
