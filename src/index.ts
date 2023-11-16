import express, { Request, Response } from 'express'
import path from 'path'
import multer from 'multer'
import fs from 'fs'
import morgan from 'morgan'
import cors, { CorsOptions } from 'cors'

const main = async () => {
  const app = express()

  app.use(express.json())

  const corsOptions: CorsOptions = {
    credentials: true,
    origin: 'http://localhost:3000',
    preflightContinue: true,
  }

  app.use(cors(corsOptions))

  app.use(morgan('dev'))

  app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
  app.use('/upfile', express.static(path.join(__dirname, 'uploads')))

  const storage = multer.diskStorage({
    destination: (_, __, cb) => {
      cb(null, path.join(__dirname, 'uploads'))
    },
    filename: (_, file, cb) => {
      const filename = file.originalname
      cb(null, filename)
    },
  })

  const upload = multer({ storage: storage })

  const PORT = process.env.PORT || 4000

  app.post('/upfile', upload.single('file'), (req, res) => {
    console.log(req.file)
    if (!req.file) {
      return res.status(400).send('No file found!')
    }
    return res.status(201).send('File uploaded successfully')
  })

  app.post(
    '/upload',
    upload.array('files[]', 10),
    (req: Request, res: Response) => {
      console.log(req)
      const uploadedFiles = req.files as Express.Multer.File[]

      if (!uploadedFiles || uploadedFiles.length === 0) {
        return res.status(400).send('No files uploaded.')
      }

      const fileNames = uploadedFiles.map((file) => file.filename)

      return res.status(201).send({
        success: true,
        data: `Files uploaded successfully: ${fileNames.join(', ')}`,
        error: null,
      })
    }
  )

  app.get('/files', (_: Request, res: Response) => {
    const directoryPath = path.join(__dirname, 'uploads')

    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        console.error(err)
        return res.status(500).send({
          success: false,
          data: null,
          error: 'Error reading the directory.',
        })
      }

      const fileNames = files.map((file) => {
        return path.basename(file)
      })

      return res.status(200).send(fileNames)
    })
  })

  app.get('/files/:filename', (req: Request, res: Response) => {
    const filename = req.params.filename
    const filePath = path.join(__dirname, 'uploads', filename)

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // Send the file as a response
      res.sendFile(filePath)
    } else {
      // If the file does not exist, return a 404 Not Found response
      res.status(404).send('File not found')
    }
  })

  app.get('/', (_: Request, res: Response) => {
    res.status(200).send({ success: true, data: 'Carburn IP', error: null })
  })

  app.listen(PORT, () => {
    console.log(`Server has started on PORT ${PORT}.`)
  })
}

main()
