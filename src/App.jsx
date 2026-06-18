import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import StepIndicator from './components/StepIndicator.jsx';
import Dashboard from './components/Dashboard.jsx';
import CameraCapture from './components/CameraCapture.jsx';
import IdVerification from './components/IdVerification.jsx';
import PdfPreview from './components/PdfPreview.jsx';
import SuccessScreen from './components/SuccessScreen.jsx';
import { extractIdFromPageImage } from './utils/ocrService.js';
import { generateAndDownloadPdf } from './utils/pdfGenerator.js';

const STEP = {
  DASHBOARD: 'dashboard',
  CAPTURE_PAGE1: 'capture-page1',
  PROCESSING_OCR: 'processing-ocr',
  VERIFY_ID: 'verify-id',
  CAPTURE_PAGE2: 'capture-page2',
  REVIEW: 'review',
  GENERATING: 'generating',
  DONE: 'done',
};

function getStepNumber(step) {
  switch (step) {
    case STEP.CAPTURE_PAGE1:
    case STEP.PROCESSING_OCR:
      return 1;
    case STEP.VERIFY_ID:
      return 2;
    case STEP.CAPTURE_PAGE2:
    case STEP.REVIEW:
    case STEP.GENERATING:
      return 3;
    case STEP.DONE:
      return 4;
    default:
      return 0;
  }
}

export default function App() {
  const [step, setStep] = useState(STEP.DASHBOARD);
  const [page1, setPage1] = useState(null); // { blob, url }
  const [page2, setPage2] = useState(null); // { blob, url }
  const [extractedId, setExtractedId] = useState('');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [idError, setIdError] = useState('');
  const [generalError, setGeneralError] = useState('');

  // Keep mutable refs to the latest page state so the unmount cleanup
  // effect below always revokes the correct, most recent object URLs.
  const page1Ref = useRef(null);
  const page2Ref = useRef(null);
  page1Ref.current = page1;
  page2Ref.current = page2;

  // Safety net: if the component is ever unmounted mid-flow (e.g. the
  // user closes the tab), revoke any outstanding object URLs so no
  // captured image data lingers in browser memory.
  useEffect(() => {
    return () => {
      if (page1Ref.current) URL.revokeObjectURL(page1Ref.current.url);
      if (page2Ref.current) URL.revokeObjectURL(page2Ref.current.url);
    };
  }, []);

  const handleStart = () => {
    setGeneralError('');
    setStep(STEP.CAPTURE_PAGE1);
  };

  const runOcr = useCallback(async (imageUrl) => {
    setOcrProgress(0);
    setIdError('');
    try {
      const id = await extractIdFromPageImage(imageUrl, (progress) => setOcrProgress(progress));
      setExtractedId(id || '');
      if (!id) {
        setIdError('Could not detect the ID automatically. Please type it in manually.');
      }
    } catch (err) {
      setExtractedId('');
      setIdError('OCR failed to read this page. Please type the ID manually.');
    } finally {
      setStep(STEP.VERIFY_ID);
    }
  }, []);

  const handlePage1Capture = (blob, url) => {
    setPage1({ blob, url });
    setStep(STEP.PROCESSING_OCR);
    runOcr(url);
  };

  const handleRetakePage1 = () => {
    if (page1) URL.revokeObjectURL(page1.url);
    setPage1(null);
    setExtractedId('');
    setIdError('');
    setStep(STEP.CAPTURE_PAGE1);
  };

  const handleIdChange = (value) => {
    setExtractedId(value);
    if (value) setIdError('');
  };

  const handleConfirmId = () => {
    if (!extractedId || !extractedId.trim()) {
      setIdError('Please enter a valid numeric ID before continuing.');
      return;
    }
    setStep(STEP.CAPTURE_PAGE2);
  };

  const handlePage2Capture = (blob, url) => {
    setPage2({ blob, url });
    setGeneralError('');
    setStep(STEP.REVIEW);
  };

  const handleRetakePage2 = () => {
    if (page2) URL.revokeObjectURL(page2.url);
    setPage2(null);
    setStep(STEP.CAPTURE_PAGE2);
  };

  const handleCancelCapture = () => {
    if (step === STEP.CAPTURE_PAGE1) {
      setStep(STEP.DASHBOARD);
    } else if (step === STEP.CAPTURE_PAGE2) {
      setStep(STEP.VERIFY_ID);
    }
  };

  const handleGeneratePdf = async () => {
    if (!page1 || !page2) return;
    setGeneralError('');
    setStep(STEP.GENERATING);
    try {
      await generateAndDownloadPdf([page1.url, page2.url], extractedId.trim());

      // Purge: wipe every trace of the captured pages from memory the
      // moment the download has been triggered.
      URL.revokeObjectURL(page1.url);
      URL.revokeObjectURL(page2.url);
      setPage1(null);
      setPage2(null);
      setStep(STEP.DONE);
    } catch (err) {
      setGeneralError('Something went wrong while generating the PDF. Please try again.');
      setStep(STEP.REVIEW);
    }
  };

  const handleScanAnother = () => {
    setExtractedId('');
    setOcrProgress(0);
    setIdError('');
    setGeneralError('');
    setStep(STEP.DASHBOARD);
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink-950 text-slate-100">
      <Header />

      {step !== STEP.DASHBOARD && step !== STEP.DONE && <StepIndicator currentStep={getStepNumber(step)} />}

      {step === STEP.DASHBOARD && <Dashboard onStart={handleStart} />}

      {step === STEP.CAPTURE_PAGE1 && (
        <CameraCapture
          title="Capture Page 1 (Front)"
          instructions="Align the document and keep the top-right ID number clearly visible."
          guideOverlay
          onCapture={handlePage1Capture}
          onCancel={handleCancelCapture}
        />
      )}

      {(step === STEP.PROCESSING_OCR || step === STEP.VERIFY_ID) && page1 && (
        <IdVerification
          imageUrl={page1.url}
          isProcessing={step === STEP.PROCESSING_OCR}
          ocrProgress={ocrProgress}
          extractedId={extractedId}
          onIdChange={handleIdChange}
          onRetake={handleRetakePage1}
          onConfirm={handleConfirmId}
          errorMessage={idError}
        />
      )}

      {step === STEP.CAPTURE_PAGE2 && (
        <CameraCapture
          title="Capture Page 2 (Back)"
          instructions="Capture the back side of the document."
          onCapture={handlePage2Capture}
          onCancel={handleCancelCapture}
        />
      )}

      {(step === STEP.REVIEW || step === STEP.GENERATING) && page1 && page2 && (
        <PdfPreview
          page1Url={page1.url}
          page2Url={page2.url}
          extractedId={extractedId}
          isGenerating={step === STEP.GENERATING}
          errorMessage={generalError}
          onRetakePage2={handleRetakePage2}
          onGenerate={handleGeneratePdf}
        />
      )}

      {step === STEP.DONE && <SuccessScreen extractedId={extractedId} onScanAnother={handleScanAnother} />}
    </div>
  );
}
