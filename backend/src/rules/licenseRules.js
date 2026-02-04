/**
 * License Rules
 * Rules for evaluating legal and licensing compliance
 */

// Common SPDX license identifiers for open data
const SPDX_LICENSES = [
  'CC0-1.0', 'CC-BY-1.0', 'CC-BY-2.0', 'CC-BY-2.5', 'CC-BY-3.0', 'CC-BY-4.0',
  'CC-BY-SA-1.0', 'CC-BY-SA-2.0', 'CC-BY-SA-2.5', 'CC-BY-SA-3.0', 'CC-BY-SA-4.0',
  'CC-BY-NC-1.0', 'CC-BY-NC-2.0', 'CC-BY-NC-2.5', 'CC-BY-NC-3.0', 'CC-BY-NC-4.0',
  'CC-BY-NC-SA-1.0', 'CC-BY-NC-SA-2.0', 'CC-BY-NC-SA-2.5', 'CC-BY-NC-SA-3.0', 'CC-BY-NC-SA-4.0',
  'CC-BY-ND-1.0', 'CC-BY-ND-2.0', 'CC-BY-ND-2.5', 'CC-BY-ND-3.0', 'CC-BY-ND-4.0',
  'CC-BY-NC-ND-1.0', 'CC-BY-NC-ND-2.0', 'CC-BY-NC-ND-2.5', 'CC-BY-NC-ND-3.0', 'CC-BY-NC-ND-4.0',
  'ODbL-1.0', 'ODC-By-1.0', 'PDDL-1.0',
  'MIT', 'Apache-2.0', 'GPL-3.0-only', 'GPL-3.0-or-later', 'BSD-3-Clause', 'BSD-2-Clause',
  'Unlicense', 'WTFPL'
];

// Licenses that promote open data reuse
const OPEN_LICENSES = [
  'CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'ODbL-1.0', 'ODC-By-1.0', 'PDDL-1.0',
  'Unlicense', 'MIT', 'Apache-2.0', 'BSD-3-Clause', 'BSD-2-Clause'
];

export const licenseRules = [
  {
    id: 'license-presence',
    name: 'License Present',
    description: 'Dataset must specify a license',
    category: 'legal',
    weight: 15,
    severity: 'critical',
    check: (metadata) => {
      const hasLicense = metadata.license && 
        typeof metadata.license === 'string' && 
        metadata.license.trim().length > 0;
      return {
        passed: hasLicense,
        value: metadata.license || null,
        message: hasLicense 
          ? `License specified: ${metadata.license}` 
          : 'No license specified'
      };
    },
    recommendation: 'Specify a clear license for the dataset. Consider using a standard SPDX identifier like CC-BY-4.0 or CC0-1.0.'
  },
  
  {
    id: 'license-spdx-valid',
    name: 'SPDX License Identifier',
    description: 'License should use standard SPDX identifier for interoperability',
    category: 'legal',
    weight: 8,
    severity: 'important',
    check: (metadata) => {
      if (!metadata.license) {
        return { passed: false, value: null, message: 'No license specified' };
      }
      const normalizedLicense = metadata.license.trim();
      const isSpdx = SPDX_LICENSES.some(
        spdx => spdx.toLowerCase() === normalizedLicense.toLowerCase()
      );
      return {
        passed: isSpdx,
        value: normalizedLicense,
        message: isSpdx 
          ? 'License uses standard SPDX identifier' 
          : 'License does not match a known SPDX identifier'
      };
    },
    recommendation: 'Use a standard SPDX license identifier (e.g., CC-BY-4.0, MIT, Apache-2.0) for better interoperability and legal clarity.'
  },
  
  {
    id: 'license-open',
    name: 'Open Data License',
    description: 'Dataset should use an open license that permits reuse',
    category: 'legal',
    weight: 5,
    severity: 'suggestion',
    check: (metadata) => {
      if (!metadata.license) {
        return { passed: false, value: null, message: 'No license specified' };
      }
      const normalizedLicense = metadata.license.trim();
      const isOpen = OPEN_LICENSES.some(
        open => open.toLowerCase() === normalizedLicense.toLowerCase()
      );
      return {
        passed: isOpen,
        value: normalizedLicense,
        message: isOpen 
          ? 'License promotes open data reuse' 
          : 'License may limit data reuse and sharing'
      };
    },
    recommendation: 'Consider using an open license like CC-BY-4.0 or CC0-1.0 to maximize data reuse and impact.'
  },
  
  {
    id: 'license-not-restrictive',
    name: 'License Not Overly Restrictive',
    description: 'License should not contain ND (NoDerivatives) restriction for maximum usability',
    category: 'legal',
    weight: 3,
    severity: 'suggestion',
    check: (metadata) => {
      if (!metadata.license) {
        return { passed: false, value: null, message: 'No license specified' };
      }
      const hasND = metadata.license.toUpperCase().includes('-ND');
      return {
        passed: !hasND,
        value: metadata.license,
        message: hasND 
          ? 'License contains NoDerivatives restriction' 
          : 'License allows derivative works'
      };
    },
    recommendation: 'The NoDerivatives (ND) restriction limits how others can build on your data. Consider a less restrictive license for greater impact.'
  },
  
  {
    id: 'contact-for-licensing',
    name: 'Contact Information for Licensing',
    description: 'Dataset should provide contact for licensing questions',
    category: 'legal',
    weight: 4,
    severity: 'suggestion',
    check: (metadata) => {
      const hasContact = metadata.contact_email && 
        typeof metadata.contact_email === 'string' && 
        metadata.contact_email.includes('@');
      return {
        passed: hasContact,
        value: hasContact ? metadata.contact_email : null,
        message: hasContact 
          ? 'Contact email available for licensing questions' 
          : 'No contact email provided for licensing inquiries'
      };
    },
    recommendation: 'Provide a contact email address for users with licensing questions or data access requests.'
  }
];

export default licenseRules;
