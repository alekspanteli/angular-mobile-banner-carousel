import { Pipe, PipeTransform } from '@angular/core';


@Pipe({ name: 'highlightText' })
export class HighlightTextPipe implements PipeTransform {
  transform(value: string): { text: string; highlight: boolean }[] {
    const segments: { text: string; highlight: boolean }[] = [];
    const regex = /\*\*(.*?)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(value)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ text: value.slice(lastIndex, match.index), highlight: false });
      }
      segments.push({ text: match[1], highlight: true });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < value.length) {
      segments.push({ text: value.slice(lastIndex), highlight: false });
    }

    return segments;
  }
}
