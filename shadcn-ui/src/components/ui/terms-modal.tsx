import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
import { Button } from './button';
import { ScrollArea } from './scroll-area';
import { FileText, X, Loader2 } from 'lucide-react';
import { commissionService, CommissionRates } from '../../services/commissionService';

interface TermsModalProps {
  children: React.ReactNode;
}

const TermsModal: React.FC<TermsModalProps> = ({ children }) => {
  const [commissionRates, setCommissionRates] = useState<CommissionRates | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch commission rates when modal opens
  useEffect(() => {
    if (isOpen && !commissionRates) {
      const fetchRates = async () => {
        try {
          setLoading(true);
          const rates = await commissionService.getCurrentRates();
          setCommissionRates(rates);
        } catch (error) {
          console.error('Failed to fetch commission rates:', error);
          // Use default rates if fetch fails
          setCommissionRates({
            level1: 15,
            level2: 5,
            level3: 2.5,
            lastUpdated: new Date().toISOString()
          });
        } finally {
          setLoading(false);
        }
      };
      fetchRates();
    }
  }, [isOpen, commissionRates]);

  // Reset commission rates when modal closes to ensure fresh data next time
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setCommissionRates(null);
      setLoading(true);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center text-xl font-semibold">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            Terms and Conditions
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] px-6 pb-6">
          <div className="prose prose-sm max-w-none">
            <div className="text-sm text-gray-600 leading-relaxed">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">ReffalPlan Affiliate System - Terms and Policies</h2>
              <p className="text-xs text-gray-500 mb-6">Last Updated: January 2025</p>
              
              <div className="space-y-6">
                {/* Table of Contents */}
                <section className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">📋 Table of Contents</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>1. Affiliate Program Commission Policy</div>
                    <div>7. Account Management</div>
                    <div>2. Participation Requirements</div>
                    <div>8. Privacy and Data Protection</div>
                    <div>3. Referral System Guidelines</div>
                    <div>9. Intellectual Property Rights</div>
                    <div>4. Payment and Commission Structure</div>
                    <div>10. Termination and Suspension</div>
                    <div>5. User Responsibilities</div>
                    <div>11. Dispute Resolution</div>
                    <div>6. Prohibited Activities</div>
                    <div>12. Contact Information</div>
                  </div>
                </section>

                {/* 1. Affiliate Program Commission Policy */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">1. Affiliate Program Commission Policy</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Qualifying Transactions and Commission Calculation</h4>
                      <p className="text-sm text-gray-600 mb-2">We will pay commission income in connection with "Qualifying Transactions," which occur when:</p>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-2">(a) Referral Link Usage</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-4">
                          <li>A customer uses a valid referral code provided by an affiliate</li>
                          <li>The transaction is completed through our approved payment methods</li>
                          <li>The transaction amount meets our minimum threshold requirements</li>
                          <li>The transaction is not subject to any disqualifying conditions</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Commission Structure</h4>
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        {loading ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm text-gray-600">Loading current rates...</span>
                          </div>
                        ) : (
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li><strong>Level 1 (Direct Referrals):</strong> {commissionRates?.level1 || 15}% commission on qualifying transactions</li>
                            <li><strong>Level 2 (Sub-affiliates):</strong> {commissionRates?.level2 || 5}% commission on qualifying transactions</li>
                            <li><strong>Level 3 (Sub-sub-affiliates):</strong> {commissionRates?.level3 || 2.5}% commission on qualifying transactions</li>
                          </ul>
                        )}
                        {commissionRates && (
                          <p className="text-xs text-gray-500 mt-2">
                            Last updated: {new Date(commissionRates.lastUpdated).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Disqualified Transactions</h4>
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        <p className="text-sm text-gray-600 mb-2">The following transactions are disqualified and excluded from commission payments:</p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>Any transaction completed after termination of your affiliate account</li>
                          <li>Any transaction where a cancellation, return, or refund has been initiated</li>
                          <li>Any transaction involving fraudulent or suspicious activity</li>
                          <li>Any transaction where the referral code was obtained through prohibited means</li>
                          <li>Any transaction that violates our terms of service</li>
                          <li>Any transaction involving self-referrals or artificial inflation</li>
                          <li>Any transaction where the customer does not complete the full payment process</li>
                          <li>Any transaction involving prohibited products or services</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Participation Requirements */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">2. Participation Requirements</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Enrollment and Eligibility</h4>
                      <p className="text-sm text-gray-600 mb-2">To participate in the ReffalPlan affiliate program, you must:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>Submit a complete and accurate application</li>
                        <li>Provide valid contact information and identification</li>
                        <li>Agree to these terms and policies</li>
                        <li>Maintain an active account in good standing</li>
                        <li>Comply with all applicable laws and regulations</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Account Verification</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>Email verification is required for account activation</li>
                        <li>Identity verification may be required for high-volume affiliates</li>
                        <li>Bank account verification is required for commission payments</li>
                        <li>Regular account reviews may be conducted</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 3. Referral System Guidelines */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">3. Referral System Guidelines</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Approved Methods</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>Direct sharing with potential customers</li>
                        <li>Social media posts (with proper disclosures)</li>
                        <li>Email marketing (to opted-in recipients)</li>
                        <li>Website integration (with proper attribution)</li>
                        <li>Word-of-mouth referrals</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Prohibited Methods</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>Spam or unsolicited communications</li>
                        <li>Misleading or deceptive claims</li>
                        <li>Impersonation of ReffalPlan or its representatives</li>
                        <li>Use of automated tools or bots</li>
                        <li>Purchase of traffic or leads</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 4. Payment and Commission Structure */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">4. Payment and Commission Structure</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Commission Rates</h4>
                      <div className="overflow-x-auto">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm text-gray-600">Loading current rates...</span>
                          </div>
                        ) : (
                          <table className="w-full text-xs border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="p-2 text-left border-b">Level</th>
                                <th className="p-2 text-left border-b">Description</th>
                                <th className="p-2 text-left border-b">Commission Rate</th>
                                <th className="p-2 text-left border-b">Requirements</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="p-2 border-b">Level 1</td>
                                <td className="p-2 border-b">Direct referrals</td>
                                <td className="p-2 border-b font-semibold text-green-600">{commissionRates?.level1 || 15}%</td>
                                <td className="p-2 border-b">Active affiliate account</td>
                              </tr>
                              <tr>
                                <td className="p-2 border-b">Level 2</td>
                                <td className="p-2 border-b">Sub-affiliate referrals</td>
                                <td className="p-2 border-b font-semibold text-blue-600">{commissionRates?.level2 || 5}%</td>
                                <td className="p-2 border-b">Referred by Level 1 affiliate</td>
                              </tr>
                              <tr>
                                <td className="p-2 border-b">Level 3</td>
                                <td className="p-2 border-b">Sub-sub-affiliate referrals</td>
                                <td className="p-2 border-b font-semibold text-purple-600">{commissionRates?.level3 || 2.5}%</td>
                                <td className="p-2 border-b">Referred by Level 2 affiliate</td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                        {commissionRates && (
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Rates last updated: {new Date(commissionRates.lastUpdated).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Payment Schedule</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li><strong>Payment Frequency:</strong> Monthly</li>
                        <li><strong>Payment Delay:</strong> 30 days after month-end</li>
                        <li><strong>Minimum Payout:</strong> $50 USD</li>
                        <li><strong>Payment Methods:</strong> Bank transfer, PayPal, digital wallet</li>
                        <li><strong>Currency:</strong> USD (conversion rates apply for other currencies)</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 5. User Responsibilities */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">5. User Responsibilities</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Account Security</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>Maintain secure login credentials</li>
                        <li>Report suspicious activity immediately</li>
                        <li>Keep contact information up to date</li>
                        <li>Use strong, unique passwords</li>
                        <li>Enable two-factor authentication when available</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Compliance Requirements</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>Comply with all applicable laws and regulations</li>
                        <li>Respect intellectual property rights</li>
                        <li>Maintain accurate records of referral activities</li>
                        <li>Report any violations or suspicious behavior</li>
                        <li>Cooperate with investigations and audits</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 6. Prohibited Activities */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">6. Prohibited Activities</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Fraudulent Activities</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>Creating fake accounts or identities</li>
                        <li>Manipulating referral codes or tracking systems</li>
                        <li>Self-referrals or artificial transaction inflation</li>
                        <li>Use of automated tools or bots</li>
                        <li>Click fraud or impression manipulation</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Misleading Practices</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>False advertising or deceptive claims</li>
                        <li>Impersonation of ReffalPlan or its representatives</li>
                        <li>Misrepresentation of products or services</li>
                        <li>Hidden fees or undisclosed terms</li>
                        <li>Spam or unsolicited communications</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 7. Account Management */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">7. Account Management</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Account Suspension</h4>
                      <p className="text-sm text-gray-600">We may suspend your account for violation of these terms and policies, suspicious or fraudulent activity, non-payment of fees or charges, failure to maintain required information, or legal or regulatory compliance issues.</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Account Termination</h4>
                      <p className="text-sm text-gray-600">We may terminate your account for repeated violations of our terms, fraudulent or illegal activities, non-compliance with legal requirements, failure to respond to suspension notices, or other material breaches of agreement.</p>
                    </div>
                  </div>
                </section>

                {/* 8. Privacy and Data Protection */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">8. Privacy and Data Protection</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Data Collection and Usage</h4>
                      <p className="text-sm text-gray-600">We collect and process personal information for account management, transaction data for commission calculation, usage analytics for service improvement, and communication records for support purposes. We implement industry-standard security measures and comply with applicable privacy laws.</p>
                    </div>
                  </div>
                </section>

                {/* 9. Intellectual Property Rights */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">9. Intellectual Property Rights</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">ReffalPlan Intellectual Property</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>All platform software and algorithms are proprietary</li>
                        <li>Trademarks and logos are protected intellectual property</li>
                        <li>Content and materials are subject to copyright protection</li>
                        <li>Unauthorized use is strictly prohibited</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 10. Termination and Suspension */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">10. Termination and Suspension</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Termination by User</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>You may terminate your account at any time</li>
                        <li>30-day notice required for account closure</li>
                        <li>Outstanding commissions will be paid according to schedule</li>
                        <li>Data retention policies apply</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 11. Dispute Resolution */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">11. Dispute Resolution</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Informal Resolution</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>Contact support for initial dispute resolution</li>
                        <li>Provide detailed information and documentation</li>
                        <li>Allow reasonable time for investigation</li>
                        <li>Cooperate with resolution process</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Arbitration</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>Binding arbitration for unresolved disputes</li>
                        <li>Arbitration conducted by neutral third party</li>
                        <li>Costs shared equally between parties</li>
                        <li>Decision is final and binding</li>
                      </ul>
                    </div>
                  </div>
                </section>

                {/* 12. Contact Information */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">12. Contact Information</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Support Email:</strong> support@reffalplan.com</p>
                      <p><strong>Phone:</strong> +1 (555) 123-4567</p>
                      <p><strong>Business Hours:</strong> Monday - Friday: 9:00 AM - 6:00 PM (Local Time)</p>
                      <p><strong>Legal Department:</strong> legal@reffalplan.com</p>
                      <p><strong>Compliance:</strong> compliance@reffalplan.com</p>
                      <p><strong>Privacy Officer:</strong> privacy@reffalplan.com</p>
                    </div>
                  </div>
                </section>

                {/* Appendix */}
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">📊 Appendix</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Commission Rate Schedule by Service Category</h4>
                      <div className="overflow-x-auto">
                        {loading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span className="text-sm text-gray-600">Loading current rates...</span>
                          </div>
                        ) : (
                          <table className="w-full text-xs border border-gray-200 rounded-lg">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="p-2 text-left border-b">Service Category</th>
                                <th className="p-2 text-left border-b">Level 1</th>
                                <th className="p-2 text-left border-b">Level 2</th>
                                <th className="p-2 text-left border-b">Level 3</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="p-2 border-b">Digital Services</td>
                                <td className="p-2 border-b font-semibold text-green-600">{commissionRates?.level1 || 15}%</td>
                                <td className="p-2 border-b font-semibold text-blue-600">{commissionRates?.level2 || 5}%</td>
                                <td className="p-2 border-b font-semibold text-purple-600">{commissionRates?.level3 || 2.5}%</td>
                              </tr>
                              <tr>
                                <td className="p-2 border-b">Consulting</td>
                                <td className="p-2 border-b font-semibold text-green-600">{((commissionRates?.level1 || 15) * 0.8).toFixed(1)}%</td>
                                <td className="p-2 border-b font-semibold text-blue-600">{((commissionRates?.level2 || 5) * 0.8).toFixed(1)}%</td>
                                <td className="p-2 border-b font-semibold text-purple-600">{((commissionRates?.level3 || 2.5) * 0.6).toFixed(1)}%</td>
                              </tr>
                              <tr>
                                <td className="p-2 border-b">Products</td>
                                <td className="p-2 border-b font-semibold text-green-600">{((commissionRates?.level1 || 15) * 0.67).toFixed(1)}%</td>
                                <td className="p-2 border-b font-semibold text-blue-600">{((commissionRates?.level2 || 5) * 0.6).toFixed(1)}%</td>
                                <td className="p-2 border-b font-semibold text-purple-600">{((commissionRates?.level3 || 2.5) * 0.4).toFixed(1)}%</td>
                              </tr>
                              <tr>
                                <td className="p-2 border-b">Subscriptions</td>
                                <td className="p-2 border-b font-semibold text-green-600">{((commissionRates?.level1 || 15) * 0.53).toFixed(1)}%</td>
                                <td className="p-2 border-b font-semibold text-blue-600">{((commissionRates?.level2 || 5) * 0.5).toFixed(1)}%</td>
                                <td className="p-2 border-b font-semibold text-purple-600">{((commissionRates?.level3 || 2.5) * 0.4).toFixed(1)}%</td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                        {commissionRates && (
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Base rates last updated: {new Date(commissionRates.lastUpdated).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Payment Minimums by Region</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border border-gray-200 rounded-lg">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="p-2 text-left border-b">Region</th>
                              <th className="p-2 text-left border-b">Minimum Payout</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="p-2 border-b">North America</td>
                              <td className="p-2 border-b font-semibold">$50 USD</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-b">Europe</td>
                              <td className="p-2 border-b font-semibold">€45 EUR</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-b">Asia Pacific</td>
                              <td className="p-2 border-b font-semibold">$75 USD</td>
                            </tr>
                            <tr>
                              <td className="p-2 border-b">Other Regions</td>
                              <td className="p-2 border-b font-semibold">$60 USD</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-2">Prohibited Products and Services</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        <li>Adult content or services</li>
                        <li>Gambling or betting services</li>
                        <li>Financial products requiring licensing</li>
                        <li>Health supplements without approval</li>
                        <li>Weapons or dangerous goods</li>
                        <li>Counterfeit or illegal products</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <div className="border-t pt-4 mt-6">
                  <p className="text-xs text-gray-500 text-center">
                    © 2025 ReffalPlan. All rights reserved. These terms and policies are subject to change. 
                    Users will be notified of significant changes via email and platform notifications. 
                    Continued use of the platform constitutes acceptance of updated terms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TermsModal;