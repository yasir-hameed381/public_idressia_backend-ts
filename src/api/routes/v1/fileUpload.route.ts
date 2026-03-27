import { Router } from 'express';
import multer from 'multer';
import * as controller from '../../controllers/fileUpload.controller';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.post('/multipart-upload/create', controller.createMultipartUpload);
router.post('/multipart-upload/sign-part', controller.signPart);
router.post('/multipart-upload/list-parts', controller.listParts);
router.post('/multipart-upload/complete', controller.completeMultipartUpload);
router.post('/multipart-upload/abort', controller.abortMultipartUpload);
router.post('/', upload.single('file'), controller.uploadFile);
export default router;
