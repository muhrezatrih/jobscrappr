import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidateService } from './candidate.service';

@Controller('api/candidate')
export class CandidateController {
  constructor(private candidateService: CandidateService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadResume(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Berkas CV/Resume wajib diunggah.');
    }
    return this.candidateService.processResumeUpload(file);
  }

  @Get('profile')
  async getProfile() {
    return this.candidateService.getProfile();
  }

  @Put('profile')
  async updateProfile(@Body() body: any) {
    return this.candidateService.updateProfile(body);
  }

  @Get('preferences')
  async getPreferences() {
    return this.candidateService.getPreferences();
  }

  @Put('preferences')
  async updatePreferences(@Body() body: any) {
    return this.candidateService.updatePreferences(body);
  }
}
