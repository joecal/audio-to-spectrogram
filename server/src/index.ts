import express, { Request, Response, NextFunction, Application } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import fs from "fs";
import { Lame } from "node-lame";
import http from "http";
import { Client } from "socket.io/dist/client";
import ffprobe from "ffprobe";
import ffprobeStatic from "ffprobe-static";
import { PythonShell } from "python-shell";
const io = require("socket.io");

class App {
  private port: number;
  private audioFilesPath: string;
  private socket: typeof io;
  private app: Application;
  private middleWareList: any[];

  constructor() {
    this.port = 8080;
    this.audioFilesPath = path.join(__dirname, "./audio-files/");
    this.app = express();
    this.middleWareList = [cors(), bodyParser.urlencoded({ extended: false, limit: "50mb" }), bodyParser.json({ limit: "50mb" })];
    this.intit();
  }

  private async intit(): Promise<void> {
    try {
      this.middleWare(this.middleWareList);
      this.errorStatusResponse();
      this.routes();
      const httpServer: http.Server = await this.createServer();
      this.socket = io(httpServer, {
        transports: ["websocket", "polling"],
        cors: {
          origin: "*",
        },
      });
      this.setSocketListeners(this.socket);
    } catch (error) {
      process.exit(1);
    }
  }

  private middleWare(middleWareList: any): void {
    middleWareList.forEach((eachMiddleWare: any) => {
      this.app.use(eachMiddleWare);
    });
  }

  private errorStatusResponse(): void {
    this.app.use((error: any, request: Request, response: Response, next: NextFunction) => {
      response.status(error.status).json({
        error: {
          message: error.message,
        },
      });
    });
  }

  private routes(): void {
    this.app.get("/", (request, response) => {
      response.send("Hello World!");
    });

    this.app.get("/spectrograms", (request, response) => {
      const files: any = [];
      const readFiles = fs.readdirSync(path.join(__dirname, "./spectrogram-images"));
      readFiles.forEach((fileName: string, index: number) => {
        let filePath = `${__dirname}/spectrogram-images/${fileName}`;
        const buffer = fs.readFileSync(filePath);
        const base64data: string = "data:image/png;base64," + buffer.toString("base64");
        filePath = base64data;
        const eachFile = {
          filePath,
          fileName,
        };
        files.push(eachFile);
      });
      // fs.writeFileSync(path.join(__dirname, "../../client/src/assets/spectrograms.json"), JSON.stringify(files));
      // ^^^ if files data is larger than 50mb and not running angular in dev mode ^^^
      response.json(files);
    });

    this.app.post("/file", async (request, response) => {
      try {
        const file: any = request.body;
        let fileName: string = file.name;
        let filePath: string = this.audioFilesPath + fileName;
        const base64data: string = file.content.replace(/^data:.*,/, "");

        await this.writeFile(fileName, filePath, base64data);

        let channelLayout: string | undefined = await this.isMonoOrStereo(fileName, filePath);

        if (!channelLayout) {
          channelLayout = "mono";
        }

        if (fileName.includes(".mp3")) {
          const newFileName: string = fileName.replace(".mp3", ".wav");

          filePath = await this.convertMp3ToWav(channelLayout, fileName, newFileName, filePath);
          fileName = newFileName;
        }

        const channel = "0";
        await this.generateSpectrogram(fileName, filePath, channelLayout, channel);

        await this.deleteFile(fileName, filePath);

        this.sendSocketMessage("Done!");
        response.send(true);
      } catch (error) {
        console.error(error);
        response.send(false);
      }
    });
  }

  private createServer(): Promise<http.Server> {
    return new Promise((resolve, reject) => {
      try {
        const httpServer: http.Server = http.createServer(this.app).listen(this.port, "localhost", () => {
          console.log(`Server listening at http://localhost:${this.port}`);
          resolve(httpServer);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private setSocketListeners(socket: typeof io): void {
    socket.on("connection", (client: Client) => {
      console.log("socket connect id ", client.conn.id);

      (client as any).on("disconnect", () => {
        console.log("socket disconnect id ", client.conn.id);
      });
    });
  }

  private async writeFile(fileName: string, filePath: string, base64data: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        this.sendSocketMessage(`Saving ${fileName} to ${filePath}`);
        fs.writeFile(filePath, base64data, "base64", (err: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async isMonoOrStereo(fileName: string, filePath: string): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      this.sendSocketMessage(`Checking if ${fileName} is mono or stereo`);
      ffprobe(filePath, { path: ffprobeStatic.path }, (err, info) => {
        if (err) {
          console.log(err);
          reject(err);
        }
        resolve(info.streams[0].channel_layout);
      });
    });
  }

  private async convertMp3ToWav(channelLayout: string, fileName: string, newFileName: string, filePath: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        this.sendSocketMessage(`Converting ${fileName} to ${newFileName}`);
        const mode = channelLayout === "stereo" ? "j" : "m";
        const newFilePath: string = filePath.replace(".mp3", ".wav");
        const encoder: Lame = new Lame({
          output: newFilePath,
          mode: mode,
          bitrate: 320,
        }).setFile(filePath);

        this.sendSocketMessage(`Saving ${newFileName} to ${newFilePath}`);

        encoder
          .encode()
          .then(async () => {
            await this.deleteFile(fileName, filePath);
            resolve(newFilePath);
          })
          .catch((error) => {
            reject(error);
          });
      } catch (error) {
        reject(error);
      }
    });
  }

  private async deleteFile(fileName: string, filePath: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.sendSocketMessage(`Deleting ${fileName} from ${filePath}`);
      fs.unlink(filePath, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(true);
        }
      });
    });
  }

  private sendSocketMessage(message: string) {
    console.log("message: ", message);
    this.socket.emit("log", message);
  }

  async generateSpectrogram(fileName: string, filePath: string, channelLayout: string, channel: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const shell = new PythonShell(path.join(__dirname, "./python/spectrogram.py"), {
        pythonOptions: ["-u"],
        pythonPath: "/usr/bin/python",
        args: [`${fileName}`, `${filePath}`, channelLayout, channel],
      });
      shell.on("message", (message) => {
        this.sendSocketMessage(message);
      });
      shell.end(async (error, code, signal) => {
        if (error) {
          this.sendSocketMessage(`Python shell error: ${error.message ? error.message : error}`);
          reject(error);
        }
        this.sendSocketMessage(`Python shell finished with code ${code}`);
        this.sendSocketMessage(`Python shell finished with signal ${signal}`);
        if (channelLayout === "stereo" && channel === "0") {
          await this.generateSpectrogram(fileName, filePath, channelLayout, "1");
        }
        resolve(true);
      });
    });
  }
}

export const app = new App();
