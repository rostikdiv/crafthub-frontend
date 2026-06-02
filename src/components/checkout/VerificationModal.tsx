import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  UploadIcon,
  CheckIcon,
  ClockIcon,
  FileTextIcon } from
'lucide-react';
import { Button } from '../ui/Button';
import { VerificationStatus } from '../../lib/types';
type VerificationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
};
const steps = [
{
  id: 'UPLOADED',
  label: 'UPLOADED'
},
{
  id: 'REVIEWING',
  label: 'REVIEWING'
},
{
  id: 'VERIFIED',
  label: 'VERIFIED'
}];

export function VerificationModal({
  isOpen,
  onClose,
  onVerified
}: VerificationModalProps) {
  const [status, setStatus] = useState<VerificationStatus>('PENDING');
  const [fileName, setFileName] = useState<string | null>(null);
  const handleFileSelect = () => {
    // Simulate file selection
    setFileName('credentials_doc.pdf');
    setStatus('UPLOADED');
  };
  const handleSubmit = () => {
    setStatus('REVIEWING');
    // Simulate review process
    setTimeout(() => {
      setStatus('VERIFIED');
      setTimeout(() => {
        onVerified();
        onClose();
      }, 1500);
    }, 2000);
  };
  const getStepStatus = (stepId: string) => {
    const statusOrder = ['PENDING', 'UPLOADED', 'REVIEWING', 'VERIFIED'];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = statusOrder.indexOf(stepId);
    if (stepIndex < currentIndex) return 'complete';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };
  return (
    <AnimatePresence>
      {isOpen &&
      <motion.div
        initial={{
          opacity: 0
        }}
        animate={{
          opacity: 1
        }}
        exit={{
          opacity: 0
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate/50"
        onClick={onClose}>

          <motion.div
          initial={{
            opacity: 0,
            scale: 0.95
          }}
          animate={{
            opacity: 1,
            scale: 1
          }}
          exit={{
            opacity: 0,
            scale: 0.95
          }}
          transition={{
            duration: 0.2
          }}
          className="bg-cream w-full max-w-lg rounded-sm border border-border shadow-xl"
          onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg uppercase tracking-tight text-slate">
                  CREDENTIAL VERIFICATION
                </h2>
                <p className="text-xs font-mono text-gray-500">
                  REF: VER-{Date.now().toString().slice(-6)}
                </p>
              </div>
              <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-sm transition-colors">

                <XIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Status Tracker */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  {steps.map((step, index) => {
                  const stepStatus = getStepStatus(step.id);
                  return (
                    <div key={step.id} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <div
                          className={`
                              w-10 h-10 rounded-full border-2 flex items-center justify-center
                              ${stepStatus === 'complete' ? 'bg-tactical border-tactical' : ''}
                              ${stepStatus === 'current' ? 'border-tactical' : ''}
                              ${stepStatus === 'pending' ? 'border-border' : ''}
                            `}>

                            {stepStatus === 'complete' ?
                          <CheckIcon className="w-5 h-5 text-white" /> :
                          stepStatus === 'current' ?
                          <ClockIcon className="w-5 h-5 text-tactical animate-pulse" /> :

                          <span className="text-xs font-mono text-gray-400">
                                {index + 1}
                              </span>
                          }
                          </div>
                          <span
                          className={`text-[10px] font-semibold uppercase tracking-wider mt-2 ${stepStatus === 'pending' ? 'text-gray-400' : 'text-slate'}`}>

                            {step.label}
                          </span>
                        </div>
                        {index < steps.length - 1 &&
                      <div
                        className={`w-16 h-0.5 mx-2 ${getStepStatus(steps[index + 1].id) !== 'pending' ? 'bg-tactical' : 'bg-border'}`} />

                      }
                      </div>);

                })}
                </div>
              </div>

              {/* Upload Zone */}
              {status === 'PENDING' &&
            <div
              onClick={handleFileSelect}
              className="border-2 border-dashed border-border rounded-sm p-8 text-center cursor-pointer hover:border-tactical transition-colors">

                  <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="font-semibold text-sm uppercase tracking-wider text-slate mb-2">
                    DROP CREDENTIALS HERE
                  </p>
                  <p className="text-xs text-gray-500">
                    Accepted formats: PDF, JPG, PNG (Max 10MB)
                  </p>
                </div>
            }

              {/* File Selected */}
              {status !== 'PENDING' && fileName &&
            <div className="border border-border rounded-sm p-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-tactical/10 rounded-sm flex items-center justify-center">
                    <FileTextIcon className="w-5 h-5 text-tactical" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate">
                      {fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Document uploaded successfully
                    </p>
                  </div>
                  {status === 'VERIFIED' &&
              <motion.div
                initial={{
                  scale: 0,
                  rotate: -10
                }}
                animate={{
                  scale: 1,
                  rotate: 0
                }}
                className="px-3 py-1 border-2 border-tactical text-tactical font-bold text-xs uppercase tracking-wider"
                style={{
                  transform: 'rotate(-3deg)'
                }}>

                      VERIFIED
                    </motion.div>
              }
                </div>
            }

              {/* Status Messages */}
              {status === 'REVIEWING' &&
            <p className="text-center text-sm text-gray-600 mt-4">
                  Your credentials are being reviewed. This may take a moment...
                </p>
            }

              {status === 'VERIFIED' &&
            <p className="text-center text-sm text-tactical font-semibold mt-4">
                  Verification complete. You may proceed with your order.
                </p>
            }
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose}>
                CANCEL
              </Button>
              {status === 'UPLOADED' &&
            <Button onClick={handleSubmit}>SUBMIT FOR REVIEW</Button>
            }
            </div>
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>);

}