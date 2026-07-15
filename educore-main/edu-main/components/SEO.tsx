import React, { useEffect } from 'react';

interface SEOProps {
    title: string;
    description: string;
    keywords?: string;
    canonicalPath?: string; // e.g. "/features"
    language?: 'en' | 'ta';
    noindex?: boolean;
    ogImage?: string;
    ogType?: 'website' | 'article';
    schemaMarkup?: object;
}

const DOMAIN = 'https://www.educore-omega.com';
const DEFAULT_OG_IMAGE = `${DOMAIN}/og-image.jpg`;

export const SEO: React.FC<SEOProps> = ({
    title,
    description,
    keywords,
    canonicalPath = '',
    language = 'en',
    noindex = false,
    ogImage = DEFAULT_OG_IMAGE,
    ogType = 'website',
    schemaMarkup,
}) => {
    useEffect(() => {
        // 1. Title
        document.title = title;

        // Helper: Meta tag upsert
        const updateOrCreateMeta = (name: string, value: string, isProperty = false) => {
            const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
            let element = document.head.querySelector(selector);
            if (!element) {
                element = document.createElement('meta');
                if (isProperty) {
                    element.setAttribute('property', name);
                } else {
                    element.setAttribute('name', name);
                }
                document.head.appendChild(element);
            }
            element.setAttribute('content', value);
        };

        // Helper: Link tag upsert
        const updateOrCreateLink = (rel: string, href: string, hreflang?: string) => {
            const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]:not([hreflang])`;
            let element = document.head.querySelector(selector);
            if (!element) {
                element = document.createElement('link');
                element.setAttribute('rel', rel);
                if (hreflang) {
                    element.setAttribute('hreflang', hreflang);
                }
                document.head.appendChild(element);
            }
            element.setAttribute('href', href);
        };

        // Helper: Remove element if exists
        const removeElement = (selector: string) => {
            const element = document.head.querySelector(selector);
            if (element) {
                element.remove();
            }
        };

        // 2. Meta Tags
        updateOrCreateMeta('description', description);
        if (keywords) {
            updateOrCreateMeta('keywords', keywords);
        } else {
            removeElement('meta[name="keywords"]');
        }

        // Robots
        if (noindex) {
            updateOrCreateMeta('robots', 'noindex, nofollow');
        } else {
            updateOrCreateMeta('robots', 'index, follow');
        }

        // Canonical URL (consistent trailing slash removal)
        const cleanPath = canonicalPath.replace(/\/+$/, '');
        const canonicalUrl = `${DOMAIN}/${language}${cleanPath}`;
        updateOrCreateLink('canonical', canonicalUrl);

        // Hreflang Tags (Multilingual SEO alternatives)
        const enUrl = `${DOMAIN}/en${cleanPath}`;
        const taUrl = `${DOMAIN}/ta${cleanPath}`;
        updateOrCreateLink('alternate', enUrl, 'en');
        updateOrCreateLink('alternate', taUrl, 'ta');
        updateOrCreateLink('alternate', enUrl, 'x-default'); // Default language is English

        // 3. Open Graph Metadata
        updateOrCreateMeta('og:title', title, true);
        updateOrCreateMeta('og:description', description, true);
        updateOrCreateMeta('og:url', canonicalUrl, true);
        updateOrCreateMeta('og:image', ogImage, true);
        updateOrCreateMeta('og:type', ogType, true);
        updateOrCreateMeta('og:site_name', 'EDUCORE-OMEGA', true);
        updateOrCreateMeta('og:locale', language === 'ta' ? 'ta_IN' : 'en_US', true);

        // 4. Twitter Cards Metadata
        updateOrCreateMeta('twitter:card', 'summary_large_image');
        updateOrCreateMeta('twitter:title', title);
        updateOrCreateMeta('twitter:description', description);
        updateOrCreateMeta('twitter:image', ogImage);

        // 5. Schema Markup (JSON-LD)
        let scriptElement = document.getElementById('ld-json-schema') as HTMLScriptElement;
        if (schemaMarkup) {
            if (!scriptElement) {
                scriptElement = document.createElement('script');
                scriptElement.id = 'ld-json-schema';
                scriptElement.type = 'application/ld+json';
                document.head.appendChild(scriptElement);
            }
            scriptElement.textContent = JSON.stringify(schemaMarkup);
        } else {
            if (scriptElement) {
                scriptElement.remove();
            }
        }

        // Clean up alternates/canonical on unmount if needed (optional, typically fine to keep)
    }, [title, description, keywords, canonicalPath, language, noindex, ogImage, ogType, schemaMarkup]);

    return null;
};
