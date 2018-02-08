% Create JSONs for Wadsworth TickerTask, Interesting Electrode Analysis
% Depends on another (private) repository to work: ecog2
% Uses JSONlab, available on the Matlab file Exchange

function [] = ES_NetworkData(ecog2path,blnsave)
% Input: ecog2path - absolute path to ecog2 repos, with processed subject data

savepath = '../DATA/';
strFileAppend = '_Int150525_anat';

if nargin<2,
    blnsave = true;
end

addpath(genpath([ecog2path 'Matlab/']))
addpath([ecog2path '10-10-14 Schalk/plotting/activeBrain'])

load SubInfo.mat % subNums, FSsubjs

opt.compact = 1;
opt.FloatFormat = '%0.2f';

S = 0;
for n=1:length(subNums),
    subNum = subNums(n);
    settings = getSubjectSettings(subNum);
    subjects = settings.subjects; 
    ecogruns = settings.ecogruns;
    reftype = settings.car; 
    
    for s=1:length(subjects),
        subject = subjects{s};
        ecogrun = ecogruns{s};
        
        subjectID = settings.LetterID;
        blnFreeSurfer = any(subNum==FSsubjs);

        S = S+1;


        loadpath = [ecog2path 'Processed Correlation Networks/' reftype '/broad1to200/Coherence_TwoSample/'];
        baw_coh=load([loadpath 'workspace' '_S' subject ecogrun '__Dynamic' strFileAppend '.mat'],'agg','names','dsc_utterances','Fs','fa','start_mask','end_mask','Nbsreps','xhat','xhat_jk_std','cohT','cohB','pow_trials','pow_silence'); 

        loadpath = [ecog2path 'Processed Correlation Networks/' reftype '/broad5to200/zeroLagCorr_TwoSample/wOuterBootstrap/'];
        baw_corr=load([loadpath 'workspace' '_S' subject ecogrun '_Dynamic' strFileAppend '.mat'],'agg','names','dsc_utterances','Fs','start_mask','end_mask','Nbsreps','Nbsreps_outer','xhat','xhat_jk_std','corrTB'); 
        
        l=load([ecog2path 'Preprocessed Data/SUBJECT' subject '/SUBJECT' subject '_RolAudSMG.mat'],'regions');
        regions = l.regions;
        
        assert(all(strcmpi(baw_coh.dsc_utterances.ChLbl,baw_corr.dsc_utterances.ChLbl)))
        
        dsc_broad = baw_coh.dsc_utterances;
        N = size(dsc_broad.SegValues,3);
        nnets = length(baw_coh.agg);
        fa = baw_coh.fa;
        nF = length(fa);

        ta = (baw_coh.start_mask+baw_coh.end_mask+1)*1000/2/baw_coh.Fs;

        [names,regnames] = electrodeNamesbyRegion(dsc_broad.ChLbl,regions);        
        amb = find(strcmpi(regnames,'Ambiguous'));
        for i=1:length(amb),
            regnames{amb(i)} = 'Other';
        end
        
        %% Subject File and brain image
        imgfilename = ['brainImage_' subjectID '.png'];
        
        subjects_out(S).subjectID = subjectID;
        subjects_out(S).brainFilename = imgfilename;

        [fig,brain2D,~] = create_brainImage2D(subject,'blnFreeSurfer',blnFreeSurfer,'blnsave',false,'strResolution','-r0','ecog2path',ecog2path);

        if blnsave,
            print(fig,[savepath 'brainImages/' imgfilename],'-dpng','-r0')        
        end
        imdata = imread([savepath 'brainImages/' imgfilename]);
        
        subjects_out(S).brainXLim = brain2D.xlim;
        subjects_out(S).brainYLim = brain2D.ylim;
        
        subjects_out(S).brainXpixels = size(imdata,2);
        subjects_out(S).brainYpixels = size(imdata,1);

        %% Spectrograms and Coherograms
        pow_trials = permute(cat(3,baw_coh.pow_trials{:}),[3 2 1]); % T x nF x N
        pow_silence = permute(baw_coh.pow_silence,[3 2 1]); % 1 x nF x N

        coh_trials = permute(cat(4,baw_coh.cohT{:}),[4 3 1 2]); % T x nF x N x N
        coh_silence = permute(baw_coh.cohB{1},[4 3 1 2]); % 1 x nF x N x N
        
        norm_pow = bsxfun(@minus,log(pow_trials),log(pow_silence));
        norm_coh = bsxfun(@minus,coh_trials,coh_silence);
        
        %% Coherence Network Types
        C2s_coh = zeros(N,N,nF,nnets);
%         rho_coh = zeros(N,N,nF,nnets);
        for i=1:nnets,
%             rho_coh(:,:,:,i) = cat(3,baw_coh.agg(i,:).rho); 
            C2s_coh(:,:,:,i) = cat(3,baw_coh.agg(i,:).C2s);
        end
        xh_coh = cat(4,baw_coh.xhat{:});
        xh_std_coh = cat(4,baw_coh.xhat_jk_std{:});
        zhat_n01_coh = xh_coh./xh_std_coh;

        C2s_coh = permute(C2s_coh,[4 3 1 2]); % T x nF x N x N
%         rho_coh = permute(rho_coh,[4 3 1 2]); % T x nF x N x N
%         xh_coh = permute(xh_coh,[4 3 1 2]); % T x nF x N x N
        zhat_n01_coh = permute(zhat_n01_coh,[4 3 1 2]); % T x nF x N x N
        
        %% Correlation Network Types
        C2s_corr = cat(3,baw_corr.agg.C2s);
%         rho_corr = cat(3,baw_corr.agg(:).rho);
        xh_corr = cat(3,baw_corr.xhat{:});
        xh_std_corr = cat(3,baw_corr.xhat_jk_std{:});
        zhat_n01_corr = xh_corr./xh_std_corr;

        C2s_corr = permute(C2s_corr,[3 1 2]); % T x N x N
%         rho_corr = permute(rho_corr,[3 1 2]); % T x N x N
%         xh_corr = permute(xh_corr,[3 1 2]); % T x N x N
        zhat_n01_corr = permute(zhat_n01_corr,[3 1 2]); % T x N x N

        %% channel files
        % channels_<subject> (1xN struct array) -- there will be S of these files, labeled by
        % subject. Loaded for a given subject to plot electrodes on brain
            % (key) subjectID
            % (key) channelID
            % x: x-position of node 
            % y: y-position of true
            % fixed: “true” -- must be set to a string named “true” to fix node
            % position to x and y
        clear channels_out
        channels_out(1:N) = struct('subjectID',subjectID,'channelID','','region','','x',0,'y',0,'fixed','true');
        [chNums,chOrder] = sort(cellfun(@str2num,dsc_broad.ChLbl));
        for i=1:N,
            chi = chOrder(i);
            channels_out(i).channelID = dsc_broad.ChLbl{chi};
            channels_out(i).x = brain2D.electrodes_x(chNums(i));
            channels_out(i).y = brain2D.electrodes_y(chNums(i));
            channels_out(i).region = regnames{chi};
        end
        if blnsave,
            opt.FileName = [savepath 'channels_' subjectID '.json'];
            savejson('', channels_out, opt);
        end
        
        %% spectrogram files
        % spectrogram_<subject>_<channel> (1x1 structure) -- Loaded to fill in
        % the spectrogram, spectra, and power over time plots. Store each channel
        % in a separate file, so they can be loaded just for the selected channel?
        % Or, load them all in one file so that we have access to all of them at
        % once (e.g. to color the electrodes in the brain representation by their
        % power at the selected time/frequency). If we want to do the latter, may
        % be better to store all the spectra for a subject in the same array,
        % channel x time x freq
            % (key) subjectID
            % (key) channelID
            % data: spectrogram (time x freq)
        for i=1:N,
            clear spectrogram_out
            spectrogram_out.subjectID = subjectID;
            spectrogram_out.channelID = dsc_broad.ChLbl{i};
            spectrogram_out.data = squeeze(norm_pow(:,:,i));
            
            if blnsave,
                opt.FileName = [savepath 'spectrogram_' subjectID '_' dsc_broad.ChLbl{i} '.json'];
                savejson('', spectrogram_out, opt);
            end
        end
            
        %% edges files
        % edges_<subject>_<edgeType>  (1xE struct array) -- there will be (T x S)
        % of these files, labeled by subject and edge type (correlation, coherence,
        % etc). Loaded for a given subject and edge type to plot network on brain.
        % E = number of edges (N * (N-1))/2.
            % (key) source: channel id
            % (key) target: channel id
            % (key) subjectID
            % data: edge statistic (time x freq)
        edges_ind = nchoosek(1:N, 2);
        nedges = size(edges_ind,1);
        clear edges_out
        edges_out(1:nedges) = struct('subjectID',subjectID,'source','','target','','data',[]);
        for k=1:nedges,
            i = edges_ind(k,1);
            j = edges_ind(k,2);
            assert(i<j) % required because only the upper triangle of rho, xh, zhat_n01 is populated
            
            lbls = {dsc_broad.ChLbl{i},dsc_broad.ChLbl{j}};
            [~,li] = sort(cellfun(@str2num,lbls));
            
            edges_out(k).source = lbls{li(1)};
            edges_out(k).target = lbls{li(2)};
            edges_out(k).data = squeeze(norm_coh(:,:,i,j));
        end
        if blnsave,
            opt.FileName = [savepath 'edges_' subjectID '_rawDiff_coh.json'];
            savejson('', edges_out, opt);
        end

        for k=1:nedges,
            i = edges_ind(k,1);
            j = edges_ind(k,2);
            edges_out(k).data = squeeze(C2s_coh(:,:,i,j));
        end
        if blnsave,
            opt.FileName = [savepath 'edges_' subjectID '_C2s_coh.json'];
            savejson('', edges_out, opt);
        end
        
%         for k=1:nedges,
%             i = edges_ind(k,1);
%             j = edges_ind(k,2);
%             edges_out(k).data = squeeze(xh_coh(:,:,i,j));
%         end
%         if blnsave,
%             opt.FileName = [savepath 'edges_' subjectID '_xhat_coh.json'];
%             savejson('', edges_out, opt);
%         end
        
        for k=1:nedges,
            i = edges_ind(k,1);
            j = edges_ind(k,2);
            edges_out(k).data = squeeze(zhat_n01_coh(:,:,i,j));
        end
        if blnsave,
            opt.FileName = [savepath 'edges_' subjectID '_zhat_coh.json'];
            savejson('', edges_out, opt);
        end

        for k=1:nedges,
            i = edges_ind(k,1);
            j = edges_ind(k,2);
            edges_out(k).data = squeeze(C2s_corr(:,i,j));
        end
        if blnsave,
            opt.FileName = [savepath 'edges_' subjectID '_C2s_corr.json'];
            savejson('', edges_out, opt);
        end
        
%         for k=1:nedges,
%             i = edges_ind(k,1);
%             j = edges_ind(k,2);
%             edges_out(k).data = squeeze(xh_corr(:,i,j));
%         end
%         if blnsave,
%             opt.FileName = [savepath 'edges_' subjectID '_xhat_corr.json'];
%             savejson('', edges_out, opt);
%         end
        
        for k=1:nedges,
            i = edges_ind(k,1);
            j = edges_ind(k,2);
            edges_out(k).data = squeeze(zhat_n01_corr(:,i,j));
        end
        if blnsave,
            opt.FileName = [savepath 'edges_' subjectID '_zhat_corr.json'];
            savejson('', edges_out, opt);
        end



    end
end

%% subject files
% subjects (1xS struct array) -- for populating the subject selection
% dropdown
    % (key) subjectID
    % brainPath: path to the brain image for the subject (on which to
    % overlay the electrodes) -- it might be tricky to align the image and
    % the electrodes without the 3d brain representation from Matlab. (not
    % necessary for the simulated data)
if blnsave,
    opt.FileName = [savepath 'subjects.json'];
    savejson('', subjects_out, opt);
end

%% edgeTypes
edgeTypes_out(1).edgeTypeID = 'rawDiff_coh';
edgeTypes_out(1).edgeTypeName = 'Coherence difference';
edgeTypes_out(1).isFreq = true;
edgeTypes_out(1).isWeightedNetwork = true;
edgeTypes_out(1).units = 'Coherence difference';
edgeTypes_out(1).description = 'Coh(Speech) - Coh(Silence)';

edgeTypes_out(2).edgeTypeID = 'C2s_coh';
edgeTypes_out(2).edgeTypeName = 'Two-sided binary coherence';
edgeTypes_out(2).isFreq = true;
edgeTypes_out(2).isWeightedNetwork = false;
edgeTypes_out(2).units = '{-1: Speech<Silence; 0: No difference; 1: Speech>Silence';
edgeTypes_out(2).description = 'Two-sided test for H_0: zhat=0';

% edgeTypes_out(3).edgeTypeID = 'xhat_coh';
% edgeTypes_out(3).edgeTypeName = 'Xhat Coherence';
% edgeTypes_out(3).isFreq = true;
% edgeTypes_out(3).isWeightedNetwork = true;
% edgeTypes_out(3).units = 'atanh(coherence) difference';
% edgeTypes_out(3).description = 'atanh(Coh(Speech)) - atanh(Coh(Silence))';

edgeTypes_out(3).edgeTypeID = 'zhat_coh';
edgeTypes_out(3).edgeTypeName = 'Weighted coherence';
edgeTypes_out(3).isFreq = true;
edgeTypes_out(3).isWeightedNetwork = true;
edgeTypes_out(3).units = 'Standard deviations';
edgeTypes_out(3).description = '(atanh(Coh(Speech)) - atanh(Coh(Silence)))/sqrt(var_jk(Speech) + var_jk(Silence))';

edgeTypes_out(4).edgeTypeID = 'C2s_corr';
edgeTypes_out(4).edgeTypeName = 'Two-sided binary correlation';
edgeTypes_out(4).isFreq = false;
edgeTypes_out(4).isWeightedNetwork = false;
edgeTypes_out(4).units = '{-1: Speech<Silence; 0: No difference; 1: Speech>Silence';
edgeTypes_out(4).description = 'Two-sided test for H_0: zhat=0';

% edgeTypes_out(6).edgeTypeID = 'xhat_corr';
% edgeTypes_out(6).edgeTypeName = 'Xhat Correlation';
% edgeTypes_out(6).isFreq = false;
% edgeTypes_out(6).isWeightedNetwork = true;
% edgeTypes_out(6).units = 'atanh(coherence) difference';
% edgeTypes_out(6).description = 'atanh(Corr(Speech)) - atanh(Corr(Silence))';

edgeTypes_out(5).edgeTypeID = 'zhat_corr';
edgeTypes_out(5).edgeTypeName = 'Weighted correlation';
edgeTypes_out(5).isFreq = false;
edgeTypes_out(5).isWeightedNetwork = true;
edgeTypes_out(5).units = 'Standard deviations';
edgeTypes_out(5).description = '(atanh(Corr(Speech)) - atanh(Corr(Silence)))/sqrt(var_jk(Speech) + var_jk(Silence))';

if blnsave,
    opt.FileName = [savepath 'edgeTypes.json'];
    savejson('', edgeTypes_out, opt);
end

%% visInfo

visInfo_out.tax = ta;
visInfo_out.fax = fa;
visInfo_out.tunits = 'ms';
visInfo_out.funits = 'Hz';
visInfo_out.brainAreas = {'Rolandic','Auditory','aSMG'};

if blnsave,
    opt.FileName = [savepath 'visInfo.json'];
    savejson('', visInfo_out, opt);
end


