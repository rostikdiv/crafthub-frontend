import React from 'react';
export function Footer() {
  return (
    <footer className="bg-slate text-cream mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo Section */}
          <div className="md:col-span-1">
            <span className="border-2 border-cream px-3 py-1 font-black text-lg tracking-stencil inline-block">
              CRAFTHUB
            </span>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              Mission-ready gear from verified suppliers. Serving operators
              since 2020.
            </p>
            <p className="mt-4 text-xs font-mono text-gray-500">
              DOC REF: CH-FTR-2026
            </p>
          </div>

          {/* Quick Links */}
          <div className="border-t md:border-t-0 md:border-l border-gray-700 pt-6 md:pt-0 md:pl-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-tactical mb-4">
              QUICK LINKS
            </h4>
            <ul className="space-y-2">
              {['Catalog', 'New Arrivals', 'Clearance', 'Sellers'].map(
                (item) =>
                <li key={item}>
                    <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-cream transition-colors">

                      {item}
                    </a>
                  </li>

              )}
            </ul>
          </div>

          {/* Support */}
          <div className="border-t md:border-t-0 md:border-l border-gray-700 pt-6 md:pt-0 md:pl-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-tactical mb-4">
              SUPPORT
            </h4>
            <ul className="space-y-2">
              {['Contact Us', 'Shipping Info', 'Returns', 'FAQ'].map((item) =>
              <li key={item}>
                  <a
                  href="#"
                  className="text-sm text-gray-400 hover:text-cream transition-colors">

                    {item}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Legal */}
          <div className="border-t md:border-t-0 md:border-l border-gray-700 pt-6 md:pt-0 md:pl-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-tactical mb-4">
              COMPLIANCE
            </h4>
            <ul className="space-y-2">
              {[
              'Terms of Service',
              'Privacy Policy',
              'Export Controls',
              'ITAR Notice'].
              map((item) =>
              <li key={item}>
                  <a
                  href="#"
                  className="text-sm text-gray-400 hover:text-cream transition-colors">

                    {item}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © 2026 CRAFTHUB. All rights reserved. UNCLASSIFIED // FOUO
          </p>
          <p className="text-xs font-mono text-gray-600">
            ISSUED: FEB 06, 2026 | REV: 1.0.0
          </p>
        </div>
      </div>
    </footer>);

}