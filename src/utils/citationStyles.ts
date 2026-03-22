import { Cite, plugins } from '@citation-js/core';
import '@citation-js/plugin-csl';
import { CSL_STYLES, AVAILABLE_STYLES as BUILT_IN_STYLES } from '../assets/cslStyles';

let stylesRegistered = false;
const allAvailableStyles = [...BUILT_IN_STYLES];

export const initCitationStyles = async () => {
  if (stylesRegistered) return;
  
  const config = plugins.config.get('@csl');
  
  // Register built-in styles
  for (const [id, xml] of Object.entries(CSL_STYLES)) {
    config.templates.add(id, xml);
  }
  
  // Fetch and register custom styles
  const res = await window.api.getCustomStyles();
  if (res.success && res.data) {
    for (const style of res.data) {
      config.templates.add(style.id, style.xml_content);
      if (!allAvailableStyles.find(s => s.id === style.id)) {
        allAvailableStyles.push({ id: style.id, name: style.name });
      }
    }
  }
  
  stylesRegistered = true;
};

export const getAvailableStyles = () => {
  return [...allAvailableStyles];
};

export const addCustomStyleToState = (style: { id: string; name: string; xml_content: string }) => {
  const config = plugins.config.get('@csl');
  config.templates.add(style.id, style.xml_content);
  if (!allAvailableStyles.find(s => s.id === style.id)) {
    allAvailableStyles.push({ id: style.id, name: style.name });
  }
};
