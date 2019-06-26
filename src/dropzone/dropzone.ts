/*
Copyright 2018 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import {
    html,
    LitElement,
    property,
    CSSResultArray,
    TemplateResult,
} from 'lit-element';

import dropzoneStyles from './dropzone.css';
import { strictCustomEvent } from '../events';

export type DropzoneEventDetail = DragEvent;

export type DropEffects = 'copy' | 'move' | 'link' | 'none';

/**
 * @slot default - This is the illustrated message slot
 */
export class Dropzone extends LitElement {
    public static readonly is = 'sp-dropzone';

    public static get styles(): CSSResultArray {
        return [dropzoneStyles];
    }

    private _dropEffect: DropEffects = 'copy';
    public get dropEffect(): DropEffects {
        return this._dropEffect;
    }
    public set dropEffect(value: DropEffects) {
        if (['copy', 'move', 'link', 'none'].includes(value)) {
            this._dropEffect = value;
        }
    }

    @property({ type: Boolean, reflect: true, attribute: 'dragged' })
    public isDragged = false;

    private debouncedDragLeave: number | null = null;

    public connectedCallback(): void {
        super.connectedCallback();

        this.addEventListener('drop', this.onDrop);
        this.addEventListener('dragover', this.onDragOver);
        this.addEventListener('dragleave', this.onDragLeave);
    }

    public disconnectedCallback(): void {
        super.disconnectedCallback();

        this.removeEventListener('drop', this.onDrop);
        this.removeEventListener('dragover', this.onDragOver);
        this.removeEventListener('dragleave', this.onDragLeave);
    }

    public onDragOver(ev: DragEvent): void {
        const shouldAcceptEvent = strictCustomEvent(
            'sp-dropzone:should-accept',
            {
                bubbles: true,
                cancelable: true,
                composed: true,
                detail: ev,
            }
        );
        // dispatch event returns true if preventDefault() is not called
        const shouldAccept = this.dispatchEvent(shouldAcceptEvent);
        if (!ev.dataTransfer) {
            return;
        }
        if (!shouldAccept) {
            ev.dataTransfer.dropEffect = 'none';
            return;
        }

        ev.preventDefault();

        this.clearDebouncedDragLeave();

        this.isDragged = true;

        ev.dataTransfer.dropEffect = this.dropEffect;
        const dragOverEvent = strictCustomEvent('sp-dropzone:dragover', {
            bubbles: true,
            composed: true,
            detail: ev,
        });
        this.dispatchEvent(dragOverEvent);
    }

    public onDragLeave(ev: DragEvent): void {
        this.clearDebouncedDragLeave();

        this.debouncedDragLeave = window.setTimeout(() => {
            if (this.isDragged) {
                this.isDragged = false;
            }

            const dragLeave = strictCustomEvent('sp-dropzone:dragleave', {
                bubbles: true,
                composed: true,
                detail: ev,
            });
            this.dispatchEvent(dragLeave);
        }, 100);
    }

    public onDrop(ev: DragEvent): void {
        ev.preventDefault();

        this.clearDebouncedDragLeave();

        if (this.isDragged) {
            this.isDragged = false;
        }
        const dropEvent = strictCustomEvent('sp-dropzone:drop', {
            bubbles: true,
            composed: true,
            detail: ev,
        });
        this.dispatchEvent(dropEvent);
    }

    protected render(): TemplateResult {
        return html`
            <slot></slot>
        `;
    }

    protected clearDebouncedDragLeave(): void {
        if (this.debouncedDragLeave) {
            clearTimeout(this.debouncedDragLeave);
            this.debouncedDragLeave = null;
        }
    }
}

declare global {
    interface GlobalEventHandlersEventMap {
        'sp-dropzone:should-accept': CustomEvent<DragEvent>;
        'sp-dropzone:dragover': CustomEvent<DragEvent>;
        'sp-dropzone:dragleave': CustomEvent<DragEvent>;
        'sp-dropzone:drop': CustomEvent<DragEvent>;
    }
}
