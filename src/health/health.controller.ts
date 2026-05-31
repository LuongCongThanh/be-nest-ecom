import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Get('ready')
  ready() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
